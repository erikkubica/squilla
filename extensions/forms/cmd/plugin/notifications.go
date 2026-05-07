package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"strings"
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

// processNotifications renders notification subjects and bodies as Go templates.
func (p *FormsPlugin) processNotifications(ctx context.Context, notifications []any, form map[string]any, submissionData map[string]any) {
	tplData := buildNotificationTemplateData(form, submissionData)

	for _, n := range notifications {
		config, ok := n.(map[string]any)
		if !ok {
			continue
		}

		enabled, _ := config["enabled"].(bool)
		if !enabled {
			continue
		}

		// Skip notification if route_when condition group evaluates to false.
		if routeWhen := parseJSONMap(config["route_when"]); routeWhen != nil {
			if !EvaluateGroup(routeWhen, submissionData) {
				continue
			}
		}

		to, _ := config["to"].(string)
		if to == "" {
			continue
		}

		subjectTmpl, _ := config["subject"].(string)
		bodyTmpl, _ := config["body"].(string)

		// Render subject as Go template
		renderedSubject, err := renderNotificationTemplate("subject", subjectTmpl, tplData)
		if err != nil {
			p.host.Log(ctx, "error", fmt.Sprintf("Failed to render notification subject: %v", err), nil)
			renderedSubject = subjectTmpl
		}

		// If no body template provided, generate a default HTML table
		renderedBody := ""
		if bodyTmpl != "" {
			renderedBody, err = renderNotificationTemplate("body", bodyTmpl, tplData)
			if err != nil {
				p.host.Log(ctx, "error", fmt.Sprintf("Failed to render notification body: %v", err), nil)
				renderedBody = bodyTmpl
			}
		} else {
			renderedBody = defaultNotificationHTML(tplData)
		}

		_ = p.host.SendEmail(ctx, coreapi.EmailRequest{
			To:      strings.Split(to, ","),
			Subject: renderedSubject,
			HTML:    renderedBody,
		})
	}
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
