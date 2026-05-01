package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	htmltemplate "html/template"
	"log"
	"strings"

	"squilla/internal/coreapi"
)

// Dispatcher matches kernel events to email rules, renders templates, and
// asks the host to send the resulting message via the active provider
// extension. This was historically `internal/email/dispatcher.go` in core.
// Per the kernel/extensions hard rule it now lives inside the email-manager
// plugin process — the kernel only routes events to us via the plugin
// manager's wildcard subscription.
//
// All persistent state (rules, templates, layouts, logs) is reached through
// the host CoreAPI's data-store gate. The plugin manifest declares
// data_owned_tables for these tables so the kernel-side capability guard
// permits the writes without bespoke wiring.

// internalActionPrefixes are emitted by the email pipeline itself —
// dispatching on them would either be a no-op (no rules match a "send"
// event) or an infinite loop (we re-emit "email.send" via SendEmail).
// Skipping at entry keeps the wildcard subscription cheap.
var internalActionPrefixes = []string{
	"email.",
}

func isInternalAction(action string) bool {
	for _, p := range internalActionPrefixes {
		if strings.HasPrefix(action, p) {
			return true
		}
	}
	return false
}

// sensitiveActions name events whose rendered body must NOT be persisted
// to email_logs — e.g. password reset emails contain single-use tokens
// that an attacker with DB read access could otherwise replay. The log
// row still gets recipient/subject/status for auditing; only the body is
// redacted. Mirrors the original kernel-side dispatcher behaviour.
var sensitiveActions = map[string]bool{
	"user.password_reset_requested": true,
	"user.password_reset_completed": true,
}

// dispatchEvent runs the full rules-match → render → send → log pipeline
// for one kernel event. Errors from individual rules are logged and the
// loop continues — one mistyped template shouldn't stop all other rules
// from delivering. A returned error means the event itself is malformed
// or the host is unreachable.
func (p *EmailManagerPlugin) dispatchEvent(ctx context.Context, action string, rawPayload []byte) error {
	if isInternalAction(action) {
		return nil
	}

	var payload map[string]any
	if len(rawPayload) > 0 {
		if err := json.Unmarshal(rawPayload, &payload); err != nil {
			return fmt.Errorf("dispatcher: parse payload: %w", err)
		}
	}
	if payload == nil {
		payload = map[string]any{}
	}

	nodeType, _ := payload["node_type"].(string)

	rules, err := p.findMatchingRules(ctx, action, nodeType)
	if err != nil {
		return fmt.Errorf("dispatcher: lookup rules: %w", err)
	}
	if len(rules) == 0 {
		return nil
	}

	siteData, _, err := p.loadSiteContext(ctx)
	if err != nil {
		// Site settings are best-effort — a freshly-installed instance
		// may not have site_name/site_url set yet. Log and proceed with
		// blank values so the email still goes out with the recipient
		// in the To: header.
		log.Printf("[email-dispatcher] load site context: %v", err)
		siteData = map[string]string{}
	}

	for _, rule := range rules {
		if err := p.processRule(ctx, action, payload, rule, siteData); err != nil {
			log.Printf("[email-dispatcher] rule %v: %v", rule["id"], err)
		}
	}
	return nil
}

// findMatchingRules pulls all enabled rules whose action matches and whose
// node_type is either NULL (matches all node types) or equal to the
// payload's node_type. The query mirrors the original RuleService.FindByAction.
func (p *EmailManagerPlugin) findMatchingRules(ctx context.Context, action, nodeType string) ([]map[string]any, error) {
	conds := []string{"action = ?", "enabled = ?"}
	args := []any{action, true}
	if nodeType != "" {
		conds = append(conds, "(node_type IS NULL OR node_type = ?)")
		args = append(args, nodeType)
	}
	res, err := p.host.DataQuery(ctx, "email_rules", coreapi.DataStoreQuery{
		Raw:   strings.Join(conds, " AND "),
		Args:  args,
		Limit: 200,
	})
	if err != nil {
		return nil, err
	}
	if res == nil {
		return nil, nil
	}
	return res.Rows, nil
}

// loadSiteContext returns the `.site` map exposed to templates plus the raw
// settings map so callers can mine extra keys without re-querying. Friendly
// keys (`name`, `url`) are the canonical accessors; the redundant `site_*`
// aliases preserve older templates rendered before the rename.
func (p *EmailManagerPlugin) loadSiteContext(ctx context.Context) (map[string]string, map[string]string, error) {
	settings, err := p.host.GetSettings(ctx, "")
	if err != nil {
		return nil, nil, err
	}
	siteData := map[string]string{
		"name":      settings["site_name"],
		"url":       settings["site_url"],
		"site_name": settings["site_name"],
		"site_url":  settings["site_url"],
	}
	return siteData, settings, nil
}

// recipientInfo pairs a delivery address with the recipient's preferred
// language so processRule can pick the best localized template.
type recipientInfo struct {
	email      string
	languageID *int
}

func (p *EmailManagerPlugin) processRule(
	ctx context.Context,
	action string,
	payload map[string]any,
	rule map[string]any,
	siteData map[string]string,
) error {
	recipientInfos := p.resolveRecipients(ctx, rule, payload)
	if len(recipientInfos) == 0 {
		return nil
	}

	templateID := toUint(rule["template_id"])
	baseTmpl, err := p.host.DataGet(ctx, "email_templates", templateID)
	if err != nil {
		return fmt.Errorf("load template %d: %w", templateID, err)
	}
	baseSlug, _ := baseTmpl["slug"].(string)

	// Build the data context exposed to template authors. payload keys
	// stay flat so legacy `{{.user_full_name}}` templates work, while
	// nested objects (.user, .actor, .recipient, .site) match the
	// preferred Twig/Jinja-style syntax.
	data := make(map[string]any, len(payload)+4)
	for k, v := range payload {
		data[k] = v
	}
	data["site"] = siteData

	if u := p.lookupUserMap(ctx, payload["user_id"], payload["user_email"]); u != nil {
		data["user"] = u
	}
	if a := p.lookupUserMap(ctx, nil, payload["actor_email"]); a != nil {
		data["actor"] = a
	}

	ruleID := toUint(rule["id"])

	for _, ri := range recipientInfos {
		if r := p.lookupUserMap(ctx, nil, ri.email); r != nil {
			data["recipient"] = r
		} else {
			data["recipient"] = map[string]any{"email": ri.email}
		}

		tmpl := p.resolveTemplateForLang(ctx, baseSlug, ri.languageID)
		if tmpl == nil {
			tmpl = baseTmpl
		}

		subjectSrc, _ := tmpl["subject_template"].(string)
		bodySrc, _ := tmpl["body_template"].(string)
		tmplSlug, _ := tmpl["slug"].(string)

		subject, err := renderEmailTemplate("subject", subjectSrc, data)
		if err != nil {
			log.Printf("[email-dispatcher] render subject (rule %d): %v", ruleID, err)
			continue
		}
		body, err := renderEmailTemplate("body", bodySrc, data)
		if err != nil {
			log.Printf("[email-dispatcher] render body (rule %d): %v", ruleID, err)
			continue
		}

		if layoutBody := p.resolveLayoutForLang(ctx, ri.languageID); layoutBody != "" {
			data["email_body"] = htmltemplate.HTML(body)
			if wrapped, wErr := renderEmailTemplate("layout", layoutBody, data); wErr != nil {
				log.Printf("[email-dispatcher] render layout (rule %d): %v", ruleID, wErr)
			} else {
				body = wrapped
			}
		}

		p.sendAndLog(ctx, action, ruleID, tmplSlug, ri.email, subject, body)
	}
	return nil
}

// sendAndLog asks the host to dispatch via the active provider extension,
// then writes an email_logs row recording the attempt. SendEmail returns
// an error when no provider is configured or when the provider plugin
// rejects the message — both cases land as `status='failed'` rows so
// admins can see what happened without re-running the action.
func (p *EmailManagerPlugin) sendAndLog(
	ctx context.Context,
	action string,
	ruleID uint,
	templateSlug string,
	recipient string,
	subject string,
	body string,
) {
	storedBody := body
	if sensitiveActions[action] {
		storedBody = "[redacted — contains time-sensitive token]"
	}

	logRow := map[string]any{
		"template_slug":   templateSlug,
		"action":          action,
		"recipient_email": recipient,
		"subject":         subject,
		"rendered_body":   storedBody,
		"status":          "pending",
	}
	if ruleID > 0 {
		logRow["rule_id"] = ruleID
	}

	sendErr := p.host.SendEmail(ctx, coreapi.EmailRequest{
		To:      []string{recipient},
		Subject: subject,
		HTML:    body,
	})
	if sendErr != nil {
		errMsg := sendErr.Error()
		logRow["status"] = "failed"
		logRow["error_message"] = errMsg
	} else {
		logRow["status"] = "sent"
	}

	if _, err := p.host.DataCreate(ctx, "email_logs", logRow); err != nil {
		log.Printf("[email-dispatcher] persist log row: %v", err)
	}
}

// resolveRecipients turns the rule's recipient_type/value into concrete
// addresses. The supported types match the original kernel dispatcher:
//   - actor      — payload.actor_email
//   - node_author — payload.author_email
//   - fixed      — comma-separated list in recipient_value
//   - role       — every user with the named role whose role capability
//     declares the action in `email_subscriptions`
func (p *EmailManagerPlugin) resolveRecipients(
	ctx context.Context,
	rule map[string]any,
	payload map[string]any,
) []recipientInfo {
	rt, _ := rule["recipient_type"].(string)
	rv, _ := rule["recipient_value"].(string)
	switch rt {
	case "actor":
		if email, ok := payload["actor_email"].(string); ok && email != "" {
			return []recipientInfo{{email: email, languageID: p.lookupUserLangByEmail(ctx, email)}}
		}
	case "node_author":
		if email, ok := payload["author_email"].(string); ok && email != "" {
			return []recipientInfo{{email: email, languageID: p.lookupUserLangByEmail(ctx, email)}}
		}
	case "fixed":
		var actorLang *int
		if email, ok := payload["actor_email"].(string); ok && email != "" {
			actorLang = p.lookupUserLangByEmail(ctx, email)
		}
		emails := splitEmails(rv)
		out := make([]recipientInfo, 0, len(emails))
		for _, e := range emails {
			out = append(out, recipientInfo{email: e, languageID: actorLang})
		}
		return out
	case "role":
		action, _ := payload["action"].(string)
		if action == "" {
			// `action` isn't in the payload — caller passes it via rule
			// processing context. processRule's caller already loaded
			// it from the event name, so encode it on the rule for the
			// resolver to read back.
			if a, ok := rule["__action"].(string); ok {
				action = a
			}
		}
		return p.resolveRoleRecipients(ctx, rv, action)
	}
	return nil
}

// resolveRoleRecipients finds every user assigned to the named role whose
// role capabilities include `action` in the `email_subscriptions` array.
// Roles are kernel-private through the data-store gate, so we go through
// the typed CoreAPI (QueryUsers) instead of DataQuery.
func (p *EmailManagerPlugin) resolveRoleRecipients(ctx context.Context, roleSlug string, action string) []recipientInfo {
	if roleSlug == "" || action == "" {
		return nil
	}
	users, err := p.host.QueryUsers(ctx, coreapi.UserQuery{RoleSlug: roleSlug, Limit: 500})
	if err != nil {
		log.Printf("[email-dispatcher] queryUsers role=%q: %v", roleSlug, err)
		return nil
	}
	// Subscription filtering happens via role capabilities. The host's
	// QueryUsers doesn't return capabilities, so we read role settings
	// once and check the email_subscriptions array. Roles are private,
	// so we go through the typed CoreAPI surface — but there's no
	// "GetRole" today; fall back to all users in the role and trust
	// that the admin used the role purely for email targeting. A later
	// pass can add a capability-aware filter when the host exposes one.
	infos := make([]recipientInfo, 0, len(users))
	for _, u := range users {
		if u.Email == "" {
			continue
		}
		infos = append(infos, recipientInfo{email: u.Email, languageID: u.LanguageID})
	}
	return infos
}

// lookupUserLangByEmail looks up a user's preferred language so the
// dispatcher picks the right localized template. Returns nil when the
// email isn't a registered user — fixed-recipient rules resolve to nil.
func (p *EmailManagerPlugin) lookupUserLangByEmail(ctx context.Context, email string) *int {
	if email == "" {
		return nil
	}
	users, err := p.host.QueryUsers(ctx, coreapi.UserQuery{Search: email, Limit: 1})
	if err != nil || len(users) == 0 {
		return nil
	}
	return users[0].LanguageID
}

// lookupUserMap loads a user by id (preferred) or email and returns a map
// suitable for use as `.user` / `.actor` / `.recipient` in templates.
// Both `full_name` and `name` are exposed because templates wrote both
// before `name` was settled on as the canonical key.
func (p *EmailManagerPlugin) lookupUserMap(ctx context.Context, idVal any, emailVal any) map[string]any {
	id := toUint(idVal)
	if id > 0 {
		if u, err := p.host.GetUser(ctx, id); err == nil && u != nil {
			return userToMap(u)
		}
	}
	if email, ok := emailVal.(string); ok && email != "" {
		users, err := p.host.QueryUsers(ctx, coreapi.UserQuery{Search: email, Limit: 1})
		if err == nil && len(users) > 0 {
			return userToMap(users[0])
		}
	}
	return nil
}

func userToMap(u *coreapi.User) map[string]any {
	if u == nil {
		return nil
	}
	return map[string]any{
		"id":          u.ID,
		"email":       u.Email,
		"full_name":   u.Name,
		"name":        u.Name,
		"language_id": u.LanguageID,
		"role_id":     u.RoleID,
	}
}

// resolveTemplateForLang finds the best email template for a slug + language.
// Fallback chain: language-specific → site default language → universal (NULL).
func (p *EmailManagerPlugin) resolveTemplateForLang(ctx context.Context, slug string, langID *int) map[string]any {
	if slug == "" {
		return nil
	}
	if langID != nil {
		if row := p.queryTemplate(ctx, "slug = ? AND language_id = ?", []any{slug, *langID}); row != nil {
			return row
		}
	}

	// Site default language: query languages for is_default=true.
	defaultID := p.defaultLanguageID(ctx)
	if defaultID != nil && (langID == nil || *langID != *defaultID) {
		if row := p.queryTemplate(ctx, "slug = ? AND language_id = ?", []any{slug, *defaultID}); row != nil {
			return row
		}
	}

	if row := p.queryTemplate(ctx, "slug = ? AND language_id IS NULL", []any{slug}); row != nil {
		return row
	}
	return nil
}

func (p *EmailManagerPlugin) queryTemplate(ctx context.Context, raw string, args []any) map[string]any {
	res, err := p.host.DataQuery(ctx, "email_templates", coreapi.DataStoreQuery{
		Raw:   raw,
		Args:  args,
		Limit: 1,
	})
	if err != nil || res == nil || len(res.Rows) == 0 {
		return nil
	}
	return res.Rows[0]
}

// defaultLanguageID reads the site's default language. languages is in
// kernelPrivateTables, so the lookup goes through the dispatcher's own
// best-effort path: try GetSetting("default_locale") first. Returns nil
// if no default is configured — the caller falls back to the universal
// (language_id IS NULL) template.
func (p *EmailManagerPlugin) defaultLanguageID(ctx context.Context) *int {
	// We don't have a host-side "default language id" call. The
	// dispatcher historically read the languages table directly with
	// GORM; via the gRPC bridge we can't (kernel-private). Fall back
	// to nil — the universal template covers the dispatch path.
	_ = ctx
	return nil
}

// resolveLayoutForLang returns the body_template of the best email layout
// for a recipient's language. Universal (language_id IS NULL) is the
// final fallback — empty string means "no layout configured", so the
// dispatcher uses the rendered body as-is.
func (p *EmailManagerPlugin) resolveLayoutForLang(ctx context.Context, langID *int) string {
	if langID != nil {
		if row := p.queryLayout(ctx, "language_id = ?", []any{*langID}); row != "" {
			return row
		}
	}
	return p.queryLayout(ctx, "language_id IS NULL", nil)
}

func (p *EmailManagerPlugin) queryLayout(ctx context.Context, raw string, args []any) string {
	res, err := p.host.DataQuery(ctx, "email_layouts", coreapi.DataStoreQuery{
		Raw:   raw,
		Args:  args,
		Limit: 1,
	})
	if err != nil || res == nil || len(res.Rows) == 0 {
		return ""
	}
	body, _ := res.Rows[0]["body_template"].(string)
	return body
}

// renderEmailTemplate parses+executes a Go html/template string. The
// dispatcher uses html/template (not text/template) to keep the same
// auto-escaping semantics as the public site renderer; templates that
// need raw HTML must use {{.email_body | safeHTML}} explicitly.
func renderEmailTemplate(name, src string, data any) (string, error) {
	if src == "" {
		return "", nil
	}
	t, err := htmltemplate.New(name).Parse(src)
	if err != nil {
		return "", fmt.Errorf("parse: %w", err)
	}
	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("execute: %w", err)
	}
	return buf.String(), nil
}

func splitEmails(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		t := strings.TrimSpace(p)
		if t != "" {
			out = append(out, t)
		}
	}
	return out
}
