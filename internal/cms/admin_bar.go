package cms

import (
	"fmt"
	"html/template"
	"net/url"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"

	"squilla/internal/auth"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
)

// Front-end admin bar: a WordPress-style toolbar the kernel prepends to
// <body> on public pages for signed-in users with admin_access.
//
// Isolation: the bar lives in a shadow root (declarative shadow DOM plus
// an inline fallback) so theme CSS cannot restyle it and its CSS cannot
// leak out. The only light-DOM effects are the host element, the
// `squilla-admin-bar` class on <html>, the --squilla-admin-bar-h custom
// property and `margin-top` on <html>. Themes offset sticky/fixed
// headers with `top: var(--squilla-admin-bar-h, 0)`.
//
// Caching: the bar is added in finishPublicHTML, after the page is fully
// rendered, so it never enters the per-block output cache. It is only
// added when a user is signed in, and every signed-in response is sent
// `private, no-cache` with `Vary: Cookie` (setPublicHTMLCacheHeaders);
// speculation rules / prefetch are emitted for anonymous visitors only.
// No HTML with the bar is ever stored or served to anyone else.
//
// Extensions add items in the browser via window.Squilla.adminBar (see
// adminBarScript and docs/extension_api.md).

const (
	// adminBarHideCookie hides the bar for the rest of the browser session.
	adminBarHideCookie = "squilla_hide_admin_bar"
	// adminBarArchiveKey holds the *termArchive a request rendered.
	adminBarArchiveKey = "squilla.admin_bar.archive"
)

type adminBarLink struct {
	Label string
	URL   string
}

// adminBarView is everything the bar renders. Built by buildAdminBarView,
// rendered by renderAdminBar; both are pure so they are unit-testable.
type adminBarView struct {
	UserName    string
	ProfileURL  string // empty → name is not a link
	Edit        []adminBarLink
	New         []adminBarLink
	ClearCache  bool
	HideControl bool
}

// adminBarAllowed: signed in, may enter the admin, did not hide the bar.
func adminBarAllowed(user *models.User, hideCookie string) bool {
	return user != nil && auth.HasCapability(user, "admin_access") && hideCookie != "1"
}

// withAdminBar injects the bar into a finished public page when allowed.
func (h *PublicHandler) withAdminBar(c *fiber.Ctx, html string, node *models.ContentNode, user *models.User, is404 bool) string {
	if user == nil {
		return html
	}
	archive, _ := c.Locals(adminBarArchiveKey).(*termArchive)
	return h.withAdminBarFor(html, node, user, is404, c.Cookies(adminBarHideCookie), archive)
}

func (h *PublicHandler) withAdminBarFor(html string, node *models.ContentNode, user *models.User, is404 bool, hideCookie string, archive *termArchive) string {
	if !adminBarAllowed(user, hideCookie) || bodyOpenTagRe.FindStringIndex(html) == nil {
		return html
	}
	var nodeTypes []models.NodeType
	if h.db != nil {
		h.db.Select("id", "slug", "label", "public").Order("id").Find(&nodeTypes)
	}
	return injectAfterBodyTag(html, renderAdminBar(buildAdminBarView(user, node, is404, archive, nodeTypes)))
}

// buildAdminBarView applies the same capability rules as the admin API:
// node writes need write access to the type (and authorship when the
// role's scope is "own"); cache clearing needs manage_settings.
func buildAdminBarView(user *models.User, node *models.ContentNode, is404 bool, archive *termArchive, nodeTypes []models.NodeType) adminBarView {
	v := adminBarView{HideControl: true}
	if user == nil {
		return v
	}
	v.UserName = user.Email
	if user.FullName != nil && strings.TrimSpace(*user.FullName) != "" {
		v.UserName = strings.TrimSpace(*user.FullName)
	}
	if auth.HasCapability(user, "manage_users") {
		v.ProfileURL = fmt.Sprintf("/admin/security/users/%d/edit", user.ID)
	}
	v.ClearCache = auth.HasCapability(user, "manage_settings")

	labels := make(map[string]string, len(nodeTypes))
	for _, nt := range nodeTypes {
		labels[nt.Slug] = nt.Label
	}
	typeLabel := func(slug string) string {
		if l := strings.TrimSpace(labels[slug]); l != "" {
			return l
		}
		return slug
	}

	if !is404 && node != nil && node.ID > 0 {
		na := auth.GetNodeAccess(user, node.NodeType)
		if na.CanWrite() && na.CanAccessNode(user.ID, node.AuthorID) {
			v.Edit = append(v.Edit, adminBarLink{Label: "Edit " + typeLabel(node.NodeType), URL: nodeEditorURL(node.NodeType, node.ID)})
		}
	}
	if !is404 && archive != nil && archive.TermID > 0 && auth.GetNodeAccess(user, archive.NodeType).CanWrite() {
		name := archive.TermName
		if name == "" {
			name = archive.Term
		}
		v.Edit = append(v.Edit, adminBarLink{
			Label: "Edit " + name,
			URL: "/admin/content/" + url.PathEscape(archive.NodeType) + "/taxonomies/" +
				url.PathEscape(archive.Taxonomy) + fmt.Sprintf("/%d/edit", archive.TermID),
		})
	}
	for _, nt := range nodeTypes {
		if nt.Public && auth.GetNodeAccess(user, nt.Slug).CanWrite() {
			v.New = append(v.New, adminBarLink{Label: typeLabel(nt.Slug), URL: nodeNewURL(nt.Slug)})
		}
	}
	return v
}

// nodeEditorURL / nodeNewURL mirror the admin-ui routes in App.tsx.
func nodeEditorURL(nodeType string, id int) string {
	switch nodeType {
	case "page":
		return fmt.Sprintf("/admin/pages/%d/edit", id)
	case "post":
		return fmt.Sprintf("/admin/posts/%d/edit", id)
	}
	return fmt.Sprintf("/admin/content/%s/%d/edit", url.PathEscape(nodeType), id)
}

func nodeNewURL(nodeType string) string {
	switch nodeType {
	case "page":
		return "/admin/pages/new"
	case "post":
		return "/admin/posts/new"
	}
	return "/admin/content/" + url.PathEscape(nodeType) + "/new"
}

var bodyOpenTagRe = regexp.MustCompile(`(?i)<body(?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?>`)

// injectAfterBodyTag inserts snippet right after the first <body ...>
// tag. Pages without one are returned unchanged.
func injectAfterBodyTag(html, snippet string) string {
	loc := bodyOpenTagRe.FindStringIndex(html)
	if loc == nil || snippet == "" {
		return html
	}
	return html[:loc[1]] + snippet + html[loc[1]:]
}

func esc(s string) string { return template.HTMLEscapeString(s) }

// renderAdminBar returns the bar markup. Every dynamic value is HTML-escaped;
// the script is a constant and reads nothing from the page except the DOM.
func renderAdminBar(v adminBarView) string {
	var b strings.Builder
	b.Grow(8192)
	b.WriteString(`<style id="squilla-admin-bar-css">` + adminBarPageCSS + `</style>`)
	b.WriteString(`<squilla-admin-bar id="squilla-admin-bar" data-no-prefetch><template shadowrootmode="open"><style>` + adminBarShadowCSS + `</style>`)
	b.WriteString(`<nav class="bar" aria-label="Admin bar"><div class="grp" data-pos="left">`)
	b.WriteString(`<a class="item brand" href="/admin/dashboard" title="Dashboard">` + adminBarLogo + `<span class="t">Dashboard</span></a>`)
	for _, l := range v.Edit {
		b.WriteString(`<a class="item edit" href="` + esc(l.URL) + `" title="` + esc(l.Label) + `">` + adminBarPencil + `<span class="t">` + esc(l.Label) + `</span></a>`)
	}
	if len(v.New) > 0 {
		b.WriteString(`<details class="dd"><summary class="item" aria-haspopup="menu"><span aria-hidden="true">+</span><span>New</span></summary><div class="menu" role="menu">`)
		for _, l := range v.New {
			b.WriteString(`<a role="menuitem" href="` + esc(l.URL) + `">` + esc(l.Label) + `</a>`)
		}
		b.WriteString(`</div></details>`)
	}
	b.WriteString(`</div><div class="grp" data-pos="right">`)
	if v.ClearCache {
		b.WriteString(`<button type="button" class="item" data-act="clear" title="Clear cache">` + adminBarRefresh + `<span class="t" data-label>Clear cache</span></button>`)
	}
	b.WriteString(`<details class="dd end"><summary class="item user" aria-haspopup="menu"><span class="av" aria-hidden="true">` + esc(initial(v.UserName)) + `</span><span class="t name">` + esc(v.UserName) + `</span></summary><div class="menu" role="menu">`)
	if v.ProfileURL != "" {
		b.WriteString(`<a role="menuitem" href="` + esc(v.ProfileURL) + `">Edit profile</a>`)
	}
	if v.HideControl {
		b.WriteString(`<button type="button" role="menuitem" data-act="hide">Hide bar this session</button>`)
	}
	b.WriteString(`<button type="button" role="menuitem" data-act="logout">Log out</button></div></details>`)
	b.WriteString(`</div></nav></template></squilla-admin-bar><script>` + adminBarScript + `</script>`)
	return b.String()
}

func initial(name string) string {
	r, _ := utf8.DecodeRuneInString(strings.TrimSpace(name))
	if r == utf8.RuneError {
		return "?"
	}
	return string(unicode.ToUpper(r))
}

// adminBarPageCSS is the only light-DOM CSS. Host rules are !important so
// theme rules like `body > * { position: relative }` cannot move the bar.
const adminBarPageCSS = `html.squilla-admin-bar{--squilla-admin-bar-h:32px;margin-top:var(--squilla-admin-bar-h)!important}` +
	`@media (max-width:600px){html.squilla-admin-bar{--squilla-admin-bar-h:46px}}` +
	`#squilla-admin-bar{display:block!important;position:fixed!important;top:0!important;left:0!important;right:0!important;` +
	`width:auto!important;margin:0!important;padding:0!important;transform:none!important;z-index:2147483000!important}` +
	`@media print{#squilla-admin-bar{display:none!important}html.squilla-admin-bar{margin-top:0!important}}`

const adminBarShadowCSS = `:host{all:initial;display:block}` +
	`*{box-sizing:border-box}` +
	`.bar{display:flex;align-items:stretch;justify-content:space-between;gap:8px;height:32px;padding:0 6px;` +
	`background:#1d2327;color:#f0f0f1;font:13px/1 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;` +
	`-webkit-font-smoothing:antialiased;box-shadow:0 1px 0 rgba(0,0,0,.25)}` +
	`.grp{display:flex;align-items:stretch;min-width:0}` +
	`.grp[data-pos=left]{flex:1 1 auto}` +
	`.item{display:inline-flex;align-items:center;gap:6px;height:100%;padding:0 10px;margin:0;border:0;background:none;color:inherit;` +
	`font:inherit;text-decoration:none;white-space:nowrap;cursor:pointer;list-style:none;border-radius:0}` +
	`.item::-webkit-details-marker{display:none}` +
	`.item:hover,.dd[open]>.item{background:#2c3338;color:#72aee6}` +
	`.item:focus-visible,.menu a:focus-visible,.menu button:focus-visible{outline:2px solid #72aee6;outline-offset:-2px}` +
	`.item[aria-pressed=true]{background:#2271b1;color:#fff}` +
	`.item svg{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}` +
	`.brand svg{width:18px;height:18px}` +
	`.edit .t{max-width:22ch;overflow:hidden;text-overflow:ellipsis}` +
	`.dd{position:relative;display:flex}` +
	`.menu{position:absolute;top:100%;left:0;min-width:180px;padding:6px 0;background:#2c3338;box-shadow:0 6px 18px rgba(0,0,0,.3);` +
	`display:flex;flex-direction:column;max-height:70vh;overflow:auto}` +
	`.dd.end .menu{left:auto;right:0}` +
	`.menu a,.menu button{display:block;width:100%;padding:8px 14px;border:0;background:none;color:#f0f0f1;font:inherit;` +
	`text-align:left;text-decoration:none;white-space:nowrap;cursor:pointer}` +
	`.menu a:hover,.menu button:hover{background:#1d2327;color:#72aee6}` +
	`.av{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#2271b1;color:#fff;font-size:11px;font-weight:600}` +
	`.name{max-width:18ch;overflow:hidden;text-overflow:ellipsis}` +
	`@media (max-width:600px){.bar{height:46px;padding:0 2px}.item{padding:0 12px}.t{display:none}.item svg{width:20px;height:20px}` +
	`.menu a,.menu button{padding:12px 16px}.edit .t{display:none}}`

const adminBarLogo = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c-4 0-7 3-7 7 0 3 2 5 4 6v4h6v-4c2-1 4-3 4-6 0-4-3-7-7-7z"/><path d="M9 21h6"/></svg>`
const adminBarPencil = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`
const adminBarRefresh = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>`

// adminBarScript: shadow-root fallback, <html> class, dropdown behaviour,
// built-in actions, and the window.Squilla.adminBar extension API.
// Constant — no server data is interpolated into it.
const adminBarScript = `(function(){var d=document,W=window,host=d.getElementById("squilla-admin-bar");if(!host)return;` +
	`var root=host.shadowRoot;if(!root){var tpl=host.querySelector("template");root=host.attachShadow({mode:"open"});if(tpl){root.appendChild(tpl.content.cloneNode(true));tpl.remove()}}` +
	`d.documentElement.classList.add("squilla-admin-bar");` +
	`var grp={left:root.querySelector('[data-pos="left"]'),right:root.querySelector('[data-pos="right"]')},items={};` +
	`function dds(){return root.querySelectorAll("details.dd")}` +
	`function closeAll(except){dds().forEach(function(x){if(x!==except)x.open=false})}` +
	`dds().forEach(function(x){x.addEventListener("toggle",function(){if(x.open)closeAll(x)})});` +
	`d.addEventListener("click",function(e){if(e.composedPath().indexOf(host)<0)closeAll()},true);` +
	`root.addEventListener("keydown",function(e){if(e.key!=="Escape")return;var o=root.querySelector("details.dd[open]");if(o){o.open=false;o.querySelector("summary").focus()}});` +
	`function hideCookie(v){d.cookie="` + adminBarHideCookie + `="+(v?"1":"")+"; path=/; SameSite=Lax"+(v?"":"; max-age=0")}` +
	`function post(u){return fetch(u,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:"{}"})}` +
	`root.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-act]");if(!b)return;var a=b.getAttribute("data-act");` +
	`if(a==="hide"){hideCookie(true);W.location.reload()}` +
	`else if(a==="logout"){b.disabled=true;hideCookie(false);post("/auth/logout").finally(function(){W.location.reload()})}` +
	`else if(a==="clear"){var l=b.querySelector("[data-label]");b.disabled=true;b.title=l.textContent="Clearing…";` +
	`post("/admin/api/cache/clear").then(function(r){return r.ok}).catch(function(){return false}).then(function(ok){` +
	`b.title=l.textContent=ok?"Cache cleared":"Clear failed";setTimeout(function(){b.disabled=false;b.title=l.textContent="Clear cache"},2000)})}});` +
	`function href(h){try{var u=new URL(String(h),W.location.href);return /^https?:$/.test(u.protocol)?u.href:null}catch(_){return null}}` +
	`function paint(el,it){el.textContent=String(it.label==null?"":it.label);if(it.title)el.title=String(it.title);` +
	`if(it.active!=null)el.setAttribute("aria-pressed",it.active?"true":"false")}` +
	`var api={ready:true,` +
	`add:function(it){if(!it||!it.id)return null;api.remove(it.id);var u=it.href?href(it.href):null,el=d.createElement(u?"a":"button");` +
	`if(u)el.href=u;else el.type="button";el.className="item";el.setAttribute("data-id",String(it.id));paint(el,it);` +
	`var h={id:it.id,element:el,update:function(p){for(var k in p)it[k]=p[k];paint(el,it)},remove:function(){api.remove(it.id)}};` +
	`if(typeof it.onClick==="function")el.addEventListener("click",function(e){if(!u)e.preventDefault();it.onClick(e,h)});` +
	`if(it.position==="right")grp.right.insertBefore(el,grp.right.lastElementChild);else grp.left.appendChild(el);items[it.id]=h;return h},` +
	`update:function(id,p){var h=items[id];if(h)h.update(p);return h||null},` +
	`remove:function(id){var h=items[id];if(h){h.element.remove();delete items[id]}},` +
	`get:function(id){return items[id]||null}};` +
	`var S=W.Squilla=W.Squilla||{},prev=S.adminBar,q=prev&&(Array.isArray(prev)?prev:prev._q)||[];S.adminBar=api;` +
	`q.forEach(function(it){try{api.add(it)}catch(_){}});` +
	`d.dispatchEvent(new CustomEvent("squilla:adminbar-ready",{bubbles:true,detail:api}))})();`
