package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"net/mail"
	"strings"
	texttemplate "text/template"
	"time"

	"squilla/internal/coreapi"
)

// buildNotificationTemplateData returns the data context exposed to
// notification subject/body Go templates. Keys are snake_case to match
// the kernel's template-variable convention and the form-rendering
// namespace ({{.form.*}}). Available keys:
//
//	{{.form.id}} / {{.form.name}} / {{.form.slug}}   — form metadata
//	{{.field.<id>}}                                  — submitted value by id
//	{{range .data}}{{.label}}: {{.value}}{{end}}     — ordered iteration
//	{{.submitted_at}}                                — RFC3339 timestamp
func buildNotificationTemplateData(form map[string]any, submission map[string]any) map[string]any {
	formName, _ := form["name"].(string)
	formSlug, _ := form["slug"].(string)
	formID := fmt.Sprintf("%v", form["id"])

	fields := getFormFields(form)
	labelByID := make(map[string]string, len(fields))
	for _, f := range fields {
		id, _ := f["id"].(string)
		label, _ := f["label"].(string)
		if id != "" && label != "" {
			labelByID[id] = label
		}
	}

	field := make(map[string]string, len(submission))
	data := make([]map[string]any, 0, len(submission))
	for k, v := range submission {
		valStr := fmt.Sprintf("%v", v)
		label := labelByID[k]
		if label == "" {
			label = k
		}
		field[k] = valStr
		data = append(data, map[string]any{
			"label": label,
			"value": valStr,
			"key":   k,
		})
	}

	return map[string]any{
		"form": map[string]any{
			"id":   formID,
			"name": formName,
			"slug": formSlug,
		},
		"field":        field,
		"data":         data,
		"submitted_at": time.Now().Format(time.RFC3339),
	}
}

func (p *FormsPlugin) triggerNotifications(form map[string]any, data map[string]any) {
	ctx := context.Background()
	notificationsJSON, ok := form["notifications"].(string)
	if !ok {
		// GORM might return it as []byte or map depending on driver/setup
		// If it's already a slice of maps:
		if n, ok := form["notifications"].([]any); ok {
			p.processNotifications(ctx, n, form, data)
			return
		}
		return
	}

	var notifications []any
	if err := json.Unmarshal([]byte(notificationsJSON), &notifications); err != nil {
		return
	}
	p.processNotifications(ctx, notifications, form, data)
}

// processNotifications renders and sends every enabled notification whose
// route_when (if any) matches the submission.
func (p *FormsPlugin) processNotifications(ctx context.Context, notifications []any, form map[string]any, submissionData map[string]any) {
	tplData := buildNotificationTemplateData(form, submissionData)
	p.addSiteData(ctx, tplData)

	for _, n := range notifications {
		config, ok := n.(map[string]any)
		if !ok {
			continue
		}
		if enabled, _ := config["enabled"].(bool); !enabled {
			continue
		}
		// Skip notification if route_when condition group evaluates to false.
		if routeWhen := parseJSONMap(config["route_when"]); routeWhen != nil {
			if !EvaluateGroup(routeWhen, submissionData) {
				continue
			}
		}

		req := p.composeNotification(ctx, config, tplData)
		if len(req.To) == 0 {
			p.host.Log(ctx, "warn", "form notification skipped: no valid recipient", map[string]any{"form": tplData["form"], "notification": config["name"]})
			continue
		}
		if err := p.host.SendEmail(ctx, req); err != nil {
			p.host.Log(ctx, "error", fmt.Sprintf("form notification not sent: %v", err), map[string]any{"form": tplData["form"], "notification": config["name"]})
		}
	}
}

// composeNotification turns one saved notification into an email. It
// honours what the admin editor saves: `recipients` (a template, e.g.
// {{.site_email}} or {{.field.email}} for an auto-responder), falling back
// to `recipient_field` and then the legacy `to`; plus `cc`, `bcc` and
// `reply_to`, all templates (reply_to may also be a bare field id, which
// is what the editor's Reply-to dropdown saves). Addresses that do not parse are dropped, so
// a guest's typo never reaches the provider. The body is wrapped in the
// site's default email layout when the email-manager publishes one.
func (p *FormsPlugin) composeNotification(ctx context.Context, config map[string]any, tplData map[string]any) coreapi.EmailRequest {
	field := func(key string) string {
		v, _ := config[key].(string)
		if v == "" {
			return ""
		}
		// Header values are plain text: html/template would turn
		// "Sarah <s@x>" into "Sarah &lt;s@x&gt;" and "&" into "&amp;".
		out, err := renderTextTemplate(key, v, tplData)
		if err != nil {
			return ""
		}
		return strings.TrimSpace(out)
	}

	to := parseAddresses(field("recipients"))
	if len(to) == 0 {
		if rf, _ := config["recipient_field"].(string); rf != "" {
			if fields, ok := tplData["field"].(map[string]string); ok {
				to = parseAddresses(fields[rf])
			}
		}
	}
	if len(to) == 0 {
		legacy, _ := config["to"].(string)
		to = parseAddresses(legacy)
	}
	cc := without(parseAddresses(field("cc")), to)
	bcc := without(parseAddresses(field("bcc")), append(append([]string{}, to...), cc...))
	replyTo := ""
	if r := parseAddresses(replyToSource(config, tplData, field)); len(r) > 0 {
		replyTo = r[0]
	}

	subject := field("subject")
	if subject == "" {
		if f, ok := tplData["form"].(map[string]any); ok {
			subject = fmt.Sprintf("New submission: %v", f["name"])
		}
	}
	body := ""
	if raw, _ := config["body"].(string); raw != "" {
		var err error
		if body, err = renderNotificationTemplate("body", raw, tplData); err != nil {
			p.host.Log(ctx, "error", fmt.Sprintf("Failed to render notification body: %v", err), nil)
			body = raw
		}
	} else {
		body = defaultNotificationHTML(tplData)
	}

	return coreapi.EmailRequest{
		To: to, CC: cc, BCC: bcc, ReplyTo: replyTo,
		Subject: subject,
		HTML:    p.wrapInLayout(ctx, body, tplData),
	}
}

// wrapInLayout asks the email-manager (event email:wrap_layout) to put
// body in the site's default email layout — the wrapper rule-based emails
// already get. A body that is a whole HTML document, a site without a
// layout, or no email-manager all leave the body as it is.
func (p *FormsPlugin) wrapInLayout(ctx context.Context, body string, tplData map[string]any) string {
	head := strings.ToLower(strings.TrimSpace(body))
	if strings.HasPrefix(head, "<!doctype") || strings.HasPrefix(head, "<html") {
		return body
	}
	results, err := p.host.EmitCollect(ctx, "email:wrap_layout", map[string]any{"html": body, "data": tplData})
	if err != nil {
		p.host.Log(ctx, "warn", fmt.Sprintf("email layout not applied: %v", err), nil)
		return body
	}
	for _, r := range results {
		if strings.TrimSpace(r) != "" {
			return r
		}
	}
	return body
}

// addSiteData exposes the site's name, URL and contact email to
// notification templates as {{.site.name}}, {{.site.url}}, {{.site.email}}
// and the editor's shorthand {{.site_email}}.
func (p *FormsPlugin) addSiteData(ctx context.Context, tplData map[string]any) {
	get := func(keys ...string) string {
		for _, k := range keys {
			if v, err := p.host.GetSetting(ctx, k); err == nil && strings.TrimSpace(v) != "" {
				return strings.TrimSpace(v)
			}
		}
		return ""
	}
	site := map[string]string{
		"name":  get("site_name"),
		"url":   strings.TrimRight(get("site_url"), "/"),
		"email": get("email", "site_email", "admin_email", "from_email"),
	}
	tplData["site"] = site
	tplData["site_email"] = site["email"]
	tplData["site_name"] = site["name"]
	tplData["site_url"] = site["url"]
}

// parseAddresses splits a comma/semicolon separated list and keeps the
// addresses that parse, deduplicated, as bare addr-specs.
func parseAddresses(list string) []string {
	var out []string
	seen := map[string]bool{}
	for _, part := range strings.FieldsFunc(list, func(r rune) bool { return r == ',' || r == ';' || r == '\n' }) {
		a, err := mail.ParseAddress(strings.TrimSpace(part))
		if err != nil {
			continue
		}
		key := strings.ToLower(a.Address)
		if !seen[key] {
			seen[key] = true
			out = append(out, a.Address)
		}
	}
	return out
}

func without(list, drop []string) []string {
	skip := make(map[string]bool, len(drop))
	for _, d := range drop {
		skip[strings.ToLower(d)] = true
	}
	out := list[:0:0]
	for _, a := range list {
		if !skip[strings.ToLower(a)] {
			out = append(out, a)
		}
	}
	return out
}

// renderTextTemplate renders a header value (subject, addresses) without
// HTML escaping. CR/LF never survive: they would let a submitted value
// inject extra mail headers.
func renderTextTemplate(name, text string, data map[string]any) (string, error) {
	t, err := texttemplate.New(name).Parse(text)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}
	return strings.NewReplacer("\r", " ", "\n", " ").Replace(buf.String()), nil
}

// renderNotificationTemplate renders a Go html/template string with notification data.
func renderNotificationTemplate(name, text string, data map[string]any) (string, error) {
	if text == "" {
		return "", nil
	}
	tmpl, err := template.New(name).Parse(text)
	if err != nil {
		return "", fmt.Errorf("template parse error: %w", err)
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("template execute error: %w", err)
	}
	return buf.String(), nil
}

// defaultNotificationHTML generates a simple HTML table for the submission data.
func defaultNotificationHTML(data map[string]any) string {
	form, _ := data["form"].(map[string]any)
	formName, _ := form["name"].(string)
	rows, _ := data["data"].([]map[string]any)

	var buf bytes.Buffer
	buf.WriteString(fmt.Sprintf("<h2>New submission for: %s</h2>", template.HTMLEscapeString(formName)))
	buf.WriteString("<table border='1' cellpadding='6' cellspacing='0'>")
	buf.WriteString("<tr><th>Field</th><th>Value</th></tr>")
	for _, row := range rows {
		label, _ := row["label"].(string)
		value, _ := row["value"].(string)
		buf.WriteString(fmt.Sprintf("<tr><td><b>%s</b></td><td>%s</td></tr>",
			template.HTMLEscapeString(label),
			template.HTMLEscapeString(value),
		))
	}
	buf.WriteString("</table>")
	return buf.String()
}

// replyToSource resolves the notification's reply_to. The editor's
// dropdown saves a bare field id ("email", or "[email]" when typed), so
// that is looked up in the submission; anything else (a {{ .field.x }}
// template or a literal address) is rendered as a template.
func replyToSource(config map[string]any, tplData map[string]any, render func(string) string) string {
	raw, _ := config["reply_to"].(string)
	id := strings.TrimSuffix(strings.TrimPrefix(strings.TrimSpace(raw), "["), "]")
	if id != "" && !strings.Contains(id, "{{") && !strings.Contains(id, "@") {
		if fields, ok := tplData["field"].(map[string]string); ok {
			return fields[id]
		}
		return ""
	}
	return render("reply_to")
}
