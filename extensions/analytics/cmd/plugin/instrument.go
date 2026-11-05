package main

import (
	"crypto/sha256"
	"encoding/hex"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"golang.org/x/net/html"
)

// The instrumenter makes one pass over the final page HTML. It copies every
// byte through unchanged and only inserts attributes:
//
//   - data-sq-b="<k>" on the top-level elements of each block / layout
//     section (the anchors of the section timelines),
//   - ping="<prefix>/c?…" on links,
//   - data-sq-o on <details open>, so the "opened" beacon ignores items
//     that were open from the start.
//
// Block boundaries come from the kernel's <!--sqx:b:…--> / <!--sqx:p:…-->
// comments, which the kernel strips afterwards.

const maxSections = 40

type section struct {
	K       int    // value of data-sq-b
	Key     string // block key shared by all elements of one block
	Layout  bool
	Form    bool
	Details bool
}

type outlineLink struct {
	Block string
	Label string
	Dest  string // normalised destination (path or host+path), see linkDest
	Class string // i internal | x external | c contact
}

type instrumented struct {
	HTML     string
	Sections []section
	Links    []outlineLink
	Hash     string
}

var voidElements = map[string]bool{
	"area": true, "base": true, "br": true, "col": true, "embed": true, "hr": true, "img": true,
	"input": true, "link": true, "meta": true, "param": true, "source": true, "track": true, "wbr": true,
}

var skipRoot = map[string]bool{"script": true, "style": true, "link": true, "meta": true, "template": true, "noscript": true}

var reKeyChars = regexp.MustCompile(`[^a-z0-9:._-]+`)

func cleanKey(s string) string {
	s = reKeyChars.ReplaceAllString(strings.ToLower(s), "-")
	if len(s) > 60 {
		s = s[:60]
	}
	return s
}

// linkDest normalises an href into a destination and a class. ok=false
// means the link is not tracked (anchors, javascript:, empty).
func linkDest(href, host string, own func(string) bool) (dest, class string, ok bool) {
	href = strings.TrimSpace(href)
	lower := strings.ToLower(href)
	switch {
	case href == "", strings.HasPrefix(href, "#"), strings.HasPrefix(lower, "javascript:"), strings.HasPrefix(lower, "data:"):
		return "", "", false
	case strings.HasPrefix(lower, "mailto:"), strings.HasPrefix(lower, "tel:"), strings.HasPrefix(lower, "sms:"):
		d := lower
		if i := strings.IndexAny(d, "?"); i >= 0 {
			d = d[:i]
		}
		return d, "c", true
	}
	u, err := url.Parse(href)
	if err != nil {
		return "", "", false
	}
	if u.Host == "" || own(u.Hostname()) {
		if u.Host == "" && u.Scheme != "" {
			return "", "", false
		}
		return normalizePath(u.Path), "i", true
	}
	d := strings.ToLower(strings.TrimPrefix(u.Hostname(), "www.")) + strings.TrimRight(u.Path, "/")
	class = "x"
	if isContactDest(d) {
		class = "c"
	}
	return d, class, true
}

type instrumentOpts struct {
	Prefix string
	NodeID int64
	Host   string
	Own    func(string) bool
	Clicks bool
}

func insertAttrs(raw []byte, attrs string) []byte {
	end := len(raw) - 1 // the closing '>'
	if end < 1 {
		return raw
	}
	if raw[end-1] == '/' {
		end--
	}
	for end > 0 && raw[end-1] == ' ' {
		end--
	}
	out := make([]byte, 0, len(raw)+len(attrs)+1)
	out = append(out, raw[:end]...)
	out = append(out, ' ')
	out = append(out, attrs...)
	return append(out, raw[end:]...)
}

func attrValue(z *html.Tokenizer, name string) (string, bool) {
	for {
		k, v, more := z.TagAttr()
		if string(k) == name {
			return string(v), true
		}
		if !more {
			return "", false
		}
	}
}

func hasAttr(raw []byte, name string) bool {
	return strings.Contains(strings.ToLower(string(raw)), " "+name)
}

// instrument rewrites src. nil is returned when there is nothing to track.
func instrument(src string, o instrumentOpts) *instrumented {
	z := html.NewTokenizer(strings.NewReader(src))
	var out strings.Builder
	out.Grow(len(src) + 2048)
	res := &instrumented{}

	type frame struct{ name string }
	var stack []frame
	var (
		blockKey, partial string
		blockDepth        = -1
		blockSeen         = map[string]int{}
		layoutN           int
		layoutKey         string
		layoutDepth       = -1
		curSection        = -1
		curLink           = -1
		sections          = 0
	)
	zone := func() string {
		switch {
		case blockKey != "":
			return blockKey
		case partial != "":
			return "p:" + partial
		case layoutKey != "":
			return layoutKey
		}
		for i := len(stack) - 1; i >= 0; i-- {
			switch stack[i].name {
			case "header":
				return "h"
			case "nav":
				return "n"
			case "footer":
				return "f"
			}
		}
		return "x"
	}
	newSection := func(key string, layout bool) int {
		sections++
		res.Sections = append(res.Sections, section{K: sections - 1, Key: key, Layout: layout})
		return sections - 1
	}

	for {
		tt := z.Next()
		if tt == html.ErrorToken {
			break
		}
		raw := append([]byte(nil), z.Raw()...)
		switch tt {
		case html.CommentToken:
			data := string(z.Token().Data)
			switch {
			case strings.HasPrefix(data, "sqx:b:"):
				parts := strings.SplitN(strings.TrimPrefix(data, "sqx:b:"), ":", 2)
				slug := "block"
				if len(parts) == 2 && cleanKey(parts[1]) != "" {
					slug = cleanKey(parts[1])
				}
				blockKey = slug + "." + strconv.Itoa(blockSeen[slug])
				blockSeen[slug]++
				blockDepth = len(stack)
			case data == "sqx:/b":
				blockKey, blockDepth, curSection = "", -1, -1
			case strings.HasPrefix(data, "sqx:p:"):
				partial = cleanKey(strings.TrimPrefix(data, "sqx:p:"))
				blockDepth = len(stack)
			case data == "sqx:/p":
				partial, blockDepth, curSection = "", -1, -1
			}
			out.Write(raw)
		case html.StartTagToken, html.SelfClosingTagToken:
			name, _ := z.TagName()
			tag := string(name)
			var extra []string
			// Top-level element of a block or partial → section anchor.
			topOfBlock := (blockKey != "" || partial != "") && len(stack) == blockDepth && !skipRoot[tag]
			mainChild := blockKey == "" && partial == "" && layoutKey == "" && len(stack) > 0 &&
				stack[len(stack)-1].name == "main" && tag == "section"
			switch {
			case topOfBlock:
				key := blockKey
				if key == "" {
					key = "p:" + partial
				}
				if sections < maxSections {
					curSection = newSection(key, blockKey == "")
					extra = append(extra, `data-sq-b="`+strconv.Itoa(curSection)+`"`)
				}
			case mainChild:
				layoutKey = "layout." + strconv.Itoa(layoutN)
				layoutN++
				layoutDepth = len(stack)
				if sections < maxSections {
					curSection = newSection(layoutKey, true)
					extra = append(extra, `data-sq-b="`+strconv.Itoa(curSection)+`"`)
				}
			}
			switch tag {
			case "form":
				if curSection >= 0 {
					res.Sections[curSection].Form = true
				}
			case "details":
				if curSection >= 0 {
					res.Sections[curSection].Details = true
				}
				if _, open := attrValue(z, "open"); open && !hasAttr(raw, "data-sq-o") {
					extra = append(extra, "data-sq-o")
				}
			case "a":
				if o.Clicks && !hasAttr(raw, "ping") {
					href, _ := attrValue(z, "href")
					if dest, class, ok := linkDest(href, o.Host, o.Own); ok && !strings.HasPrefix(dest, "/go/") {
						key := zone()
						extra = append(extra, `ping="`+o.Prefix+`/c?p=`+strconv.FormatInt(o.NodeID, 10)+`&amp;k=`+url.QueryEscape(key)+`"`)
						res.Links = append(res.Links, outlineLink{Block: key, Dest: dest, Class: class})
						curLink = len(res.Links) - 1
					}
				}
			}
			if len(extra) > 0 {
				raw = insertAttrs(raw, strings.Join(extra, " "))
			}
			out.Write(raw)
			if tt == html.StartTagToken && !voidElements[tag] {
				stack = append(stack, frame{tag})
			}
		case html.EndTagToken:
			name, _ := z.TagName()
			tag := string(name)
			for i := len(stack) - 1; i >= 0; i-- {
				if stack[i].name == tag {
					stack = stack[:i]
					break
				}
			}
			if layoutKey != "" && len(stack) <= layoutDepth {
				layoutKey, layoutDepth, curSection = "", -1, -1
			}
			if tag == "a" {
				curLink = -1
			}
			out.Write(raw)
		case html.TextToken:
			if curLink >= 0 {
				l := &res.Links[curLink]
				if len(l.Label) < 80 {
					l.Label = strings.TrimSpace(l.Label + " " + strings.Join(strings.Fields(string(z.Text())), " "))
				}
			}
			out.Write(raw)
		default:
			out.Write(raw)
		}
	}
	if len(res.Sections) == 0 && len(res.Links) == 0 {
		return nil
	}
	res.HTML = out.String()
	h := sha256.New()
	for _, s := range res.Sections {
		h.Write([]byte("s|" + s.Key + "\n"))
	}
	for _, l := range res.Links {
		h.Write([]byte("l|" + l.Block + "|" + l.Dest + "|" + l.Label + "\n"))
	}
	res.Hash = hex.EncodeToString(h.Sum(nil))[:16]
	return res
}
