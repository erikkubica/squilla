package main

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"html/template"
	"regexp"
	"strings"
)

//go:embed templates/default_layout.html
var defaultLayoutSimple string

//go:embed templates/grid_layout.html
var defaultLayoutGrid string

//go:embed templates/card_layout.html
var defaultLayoutCard string

//go:embed templates/inline_layout.html
var defaultLayoutInline string

// defaultLayoutForStyle returns the canonical layout template for a given style name.
func defaultLayoutForStyle(style string) string {
	switch style {
	case "grid":
		return defaultLayoutGrid
	case "card":
		return defaultLayoutCard
	case "inline":
		return defaultLayoutInline
	default:
		return defaultLayoutSimple
	}
}

// applyFormPostProcessing applies post-render transformations to the rendered form HTML:
//   - Injects CAPTCHA scripts/widgets
//   - Injects honeypot field
//   - Substitutes {privacy_policy_url} placeholder
//   - Appends form_css_class to the <form> tag
func applyFormPostProcessing(result string, settings map[string]any) string {
	// 1. CAPTCHA injection (before </form>)
	provider, _ := settings["captcha_provider"].(string)
	siteKey, _ := settings["captcha_site_key"].(string)
	if tag := captchaScriptTag(provider, siteKey); tag != "" {
		if idx := strings.LastIndex(strings.ToLower(result), "</form>"); idx != -1 {
			result = result[:idx] + tag + result[idx:]
		}
	}

	// 2. Honeypot injection (before </form>)
	honeypotEnabled := true
	if v, ok := settings["honeypot_enabled"]; ok {
		if b, ok := v.(bool); ok {
			honeypotEnabled = b
		}
	}
	if honeypotEnabled {
		if idx := strings.LastIndex(strings.ToLower(result), "</form>"); idx != -1 {
			result = result[:idx] + honeypotHTML + result[idx:]
		} else {
			result += honeypotHTML
		}
	}

	// 3. privacy_policy_url substitution. The placeholder lives inside
	// an href attribute, so escape ppURL first; without it a form
	// admin who sets ppURL to `" onclick="alert(1)` injects an event
	// handler that fires for every visitor rendering the form. We
	// also pre-block javascript: / data: schemes which would survive
	// HTML escaping but still clickjack the visitor.
	ppURL, _ := settings["privacy_policy_url"].(string)
	if !isSafeURL(ppURL) {
		ppURL = ""
	}
	result = strings.ReplaceAll(result, "{privacy_policy_url}", template.HTMLEscapeString(ppURL))
	if ppURL == "" {
		result = strings.ReplaceAll(result, `href=""`, "")
	}

	// 4. form_css_class injection
	cssClass, _ := settings["form_css_class"].(string)
	if cssClass != "" {
		formTagRe := regexp.MustCompile(`(?i)<form\b([^>]*)>`)
		result = formTagRe.ReplaceAllStringFunc(result, func(m string) string {
			matches := formTagRe.FindStringSubmatch(m)
			if len(matches) < 2 {
				return m
			}
			attrs := matches[1]
			escaped := template.HTMLEscapeString(cssClass)
			if strings.Contains(attrs, `class="`) {
				return strings.Replace(m, `class="`, `class="`+escaped+` `, 1)
			}
			return fmt.Sprintf(`<form%s class="%s">`, attrs, escaped)
		})
	}

	return result
}

// isSafeURL accepts only http(s) and protocol-relative / path-relative
// URLs, rejecting javascript: / data: / vbscript: schemes that an
// admin-supplied "privacy policy URL" could otherwise smuggle into
// the rendered form. Empty strings are considered safe — the caller
// strips empty hrefs separately.
func isSafeURL(u string) bool {
	u = strings.TrimSpace(u)
	if u == "" {
		return true
	}
	low := strings.ToLower(u)
	// Allow same-origin paths and protocol-relative.
	if strings.HasPrefix(low, "/") || strings.HasPrefix(low, "./") || strings.HasPrefix(low, "../") || strings.HasPrefix(low, "#") {
		return true
	}
	if strings.HasPrefix(low, "//") {
		return true
	}
	// Explicit scheme — allow http/https/mailto/tel only.
	for _, scheme := range []string{"http://", "https://", "mailto:", "tel:"} {
		if strings.HasPrefix(low, scheme) {
			return true
		}
	}
	return false
}

// normalizeFieldOptions ensures each option in a select/radio/checkbox field
// is a {label, value} object. Plain strings are converted to {label: s, value: s}.
func normalizeFieldOptions(field map[string]any) {
	raw, ok := field["options"]
	if !ok {
		return
	}

	switch opts := raw.(type) {
	case []any:
		normalized := make([]any, 0, len(opts))
		for _, opt := range opts {
			switch v := opt.(type) {
			case map[string]any:
				// Already an object — ensure label and value exist
				if _, hasLabel := v["label"]; !hasLabel {
					v["label"] = ""
				}
				if _, hasValue := v["value"]; !hasValue {
					v["value"] = ""
				}
				normalized = append(normalized, v)
			case string:
				// Backward compat: plain string → {label, value}
				normalized = append(normalized, map[string]any{
					"label": v,
					"value": v,
				})
			default:
				normalized = append(normalized, opt)
			}
		}
		field["options"] = normalized
	}
}

const honeypotHTML = `<div style="display:none!important;visibility:hidden!important;opacity:0!important;position:absolute!important;left:-9999px!important;"><input type="text" name="website_url" tabindex="-1" autocomplete="off" /></div>`

func (p *FormsPlugin) renderFormHTML(form map[string]any) (string, error) {
	layout, _ := form["layout"].(string)
	if layout == "" {
		return "", fmt.Errorf("form layout is empty")
	}

	fields := getFormFields(form)

	// Normalize option objects for each field
	for i := range fields {
		normalizeFieldOptions(fields[i])
	}

	// Build lookup map by field ID, and add each field as a top-level key
	// so templates can use {{.email.label}} shorthand.
	fieldsByID := make(map[string]any)
	topLevelFields := make(map[string]any)
	for _, f := range fields {
		id, _ := f["id"].(string)
		if id != "" {
			fieldsByID[id] = f
			topLevelFields[strings.ToLower(id)] = f
		}
	}

	tmpl, err := template.New("form").Parse(layout)
	if err != nil {
		return "", fmt.Errorf("layout parse error: %w", err)
	}

	var buf bytes.Buffer
	data := map[string]any{
		"id":           form["id"],
		"name":         form["name"],
		"fields":       fieldsByID, // map keyed by field ID — enables {{.fields.name.label}}
		"fields_list":  fields,     // ordered array — use {{range .fields_list}}
		"fields_by_id": fieldsByID,
	}

	// Merge top-level field keys into data so {{.email.label}} works.
	// Reserved keys win — a form with a field literally named "name"
	// would otherwise shadow the form's name attribute, and the layout
	// header "{{.name}}" would render the entire field map instead of
	// "Contact" (or whatever the form is called). The shorthand still
	// works for any field ID that doesn't collide; the longhand
	// {{.fields.<id>.label}} works regardless.
	reserved := map[string]bool{
		"id": true, "name": true,
		"fields": true, "fields_list": true, "fields_by_id": true,
	}
	for k, v := range topLevelFields {
		if reserved[k] {
			continue
		}
		data[k] = v
	}

	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("template execute error: %w", err)
	}

	result := buf.String()

	// Apply post-processing: captcha, honeypot, privacy_policy_url, form_css_class
	settings := getFormSettings(form)
	result = applyFormPostProcessing(result, settings)

	// Append form metadata for client-side validation.
	metaJSON, _ := json.Marshal(map[string]any{"fields": fields, "settings": settings})
	result += fmt.Sprintf(`<script type="application/json" data-vibe-form-meta="%v">%s</script>`, form["id"], metaJSON)

	return result, nil
}
