package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	htmltemplate "html/template"
	"log"
	"strings"

	"gorm.io/gorm"

	"vibecms/internal/events"
	"vibecms/internal/models"
)

// SendRequest contains everything needed to send an email.
type SendRequest struct {
	To        []string          `json:"to"`
	Subject   string            `json:"subject"`
	HTML      string            `json:"html"`
	FromEmail string            `json:"from_email"`
	FromName  string            `json:"from_name"`
	Settings  map[string]string `json:"settings"` // provider-specific settings
}

// SendFunc is a function that sends an email. Returns nil on success.
// This is the hook point — plugins and Tengo scripts implement this.
type SendFunc func(req SendRequest) error

// Dispatcher ties together rules, templates, and logging to handle
// system events and send the appropriate emails via a pluggable SendFunc.
type Dispatcher struct {
	db       *gorm.DB
	ruleSvc  *RuleService
	logSvc   *LogService
	sendFunc SendFunc
}

// NewDispatcher creates a new Dispatcher.
func NewDispatcher(db *gorm.DB, ruleSvc *RuleService, logSvc *LogService) *Dispatcher {
	return &Dispatcher{
		db:      db,
		ruleSvc: ruleSvc,
		logSvc:  logSvc,
	}
}

// SetSendFunc sets the function used to actually send emails.
// If nil, emails will be logged as "no provider configured".
func (d *Dispatcher) SetSendFunc(fn SendFunc) {
	d.sendFunc = fn
}

// HandleEvent is called by the event bus for every event.
// It finds matching rules, resolves recipients, renders templates, sends emails, and logs results.
func (d *Dispatcher) HandleEvent(action string, payload events.Payload) {
	// 1. Extract node_type from payload if present.
	nodeType := ""
	if nt, ok := payload["node_type"].(string); ok {
		nodeType = nt
	}

	// 2. Find matching enabled rules.
	rules, err := d.ruleSvc.FindByAction(action, nodeType)
	if err != nil {
		log.Printf("[email] error finding rules for action %q: %v", action, err)
		return
	}
	if len(rules) == 0 {
		return
	}

	// 3. Load site settings once for all rules.
	settings := loadSiteSettings(d.db)
	providerName := settings["email_provider"]

	// Load provider extension settings if applicable.
	providerSettings := make(map[string]string)
	providerSettings["provider"] = providerName
	if providerName != "" {
		extPrefix := "ext." + providerName + "."
		for k, v := range settings {
			if strings.HasPrefix(k, extPrefix) {
				providerSettings[strings.TrimPrefix(k, extPrefix)] = v
			}
		}
	}
	providerSettings["from_email"] = settings["from_email"]
	providerSettings["from_name"] = settings["from_name"]

	// Build site data for template rendering.
	siteData := map[string]string{
		"site_name": settings["site_name"],
		"site_url":  settings["site_url"],
	}

	// Load base email layout if configured.
	baseLayout := settings["email_base_layout"]

	for _, rule := range rules {
		d.processRule(action, payload, rule, siteData, baseLayout, providerSettings)
	}
}

// processRule handles a single rule: resolve recipients, render, send, and log.
func (d *Dispatcher) processRule(
	action string,
	payload events.Payload,
	rule models.EmailRule,
	siteData map[string]string,
	baseLayout string,
	providerSettings map[string]string,
) {
	// Resolve recipients with their language info.
	recipientInfos := d.resolveRecipientsWithLang(action, rule, payload)
	if len(recipientInfos) == 0 {
		return
	}

	// Base template from the rule (universal fallback).
	baseTmpl := rule.Template

	// Build template data: merge payload + site settings.
	data := make(map[string]interface{})
	for k, v := range payload {
		data[k] = v
	}
	data["site"] = siteData

	// Group recipients by language for efficient template resolution.
	for _, ri := range recipientInfos {
		// Resolve best template for this recipient's language.
		tmpl := d.resolveTemplateForLang(baseTmpl.Slug, ri.languageID)
		if tmpl == nil {
			tmpl = &baseTmpl
		}

		subject, err := renderTemplate("subject", tmpl.SubjectTemplate, data)
		if err != nil {
			log.Printf("[email] error rendering subject for rule %d: %v", rule.ID, err)
			continue
		}

		body, err := renderTemplate("body", tmpl.BodyTemplate, data)
		if err != nil {
			log.Printf("[email] error rendering body for rule %d: %v", rule.ID, err)
			continue
		}

		if baseLayout != "" {
			data["email_body"] = htmltemplate.HTML(body)
			wrapped, wrapErr := renderTemplate("base_layout", baseLayout, data)
			if wrapErr != nil {
				log.Printf("[email] error rendering base layout for rule %d: %v", rule.ID, wrapErr)
			} else {
				body = wrapped
			}
		}

		d.sendAndLog(action, rule, tmpl.Slug, ri.email, subject, body, providerSettings)
	}
}

// recipientInfo holds a recipient email and their preferred language.
type recipientInfo struct {
	email      string
	languageID *int
}

// resolveTemplateForLang finds the best email template for a slug + language.
// Fallback: language-specific → site default language → universal (NULL).
func (d *Dispatcher) resolveTemplateForLang(slug string, langID *int) *models.EmailTemplate {
	// 1. Try language-specific template.
	if langID != nil {
		var tmpl models.EmailTemplate
		if err := d.db.Where("slug = ? AND language_id = ?", slug, *langID).First(&tmpl).Error; err == nil {
			return &tmpl
		}
	}

	// 2. Try site default language.
	var defaultLang models.Language
	if err := d.db.Where("is_default = ?", true).First(&defaultLang).Error; err == nil {
		if langID == nil || *langID != defaultLang.ID {
			var tmpl models.EmailTemplate
			if err := d.db.Where("slug = ? AND language_id = ?", slug, defaultLang.ID).First(&tmpl).Error; err == nil {
				return &tmpl
			}
		}
	}

	// 3. Universal fallback (language_id IS NULL).
	var tmpl models.EmailTemplate
	if err := d.db.Where("slug = ? AND language_id IS NULL", slug).First(&tmpl).Error; err == nil {
		return &tmpl
	}

	return nil
}

// sendAndLog sends an email via the configured SendFunc and logs the result.
func (d *Dispatcher) sendAndLog(
	action string,
	rule models.EmailRule,
	templateSlug string,
	recipient string,
	subject string,
	body string,
	providerSettings map[string]string,
) {
	providerName := providerSettings["provider"]
	logEntry := &models.EmailLog{
		RuleID:         &rule.ID,
		TemplateSlug:   templateSlug,
		Action:         action,
		RecipientEmail: recipient,
		Subject:        subject,
		RenderedBody:   body,
		Provider:       &providerName,
	}

	if d.sendFunc == nil {
		errMsg := "no email provider configured"
		logEntry.Status = "failed"
		logEntry.ErrorMessage = &errMsg
		if err := d.logSvc.Create(logEntry); err != nil {
			log.Printf("[email] error logging failed send: %v", err)
		}
		return
	}

	req := SendRequest{
		To:        []string{recipient},
		Subject:   subject,
		HTML:      body,
		FromEmail: providerSettings["from_email"],
		FromName:  providerSettings["from_name"],
		Settings:  providerSettings,
	}

	if err := d.sendFunc(req); err != nil {
		errMsg := err.Error()
		logEntry.Status = "failed"
		logEntry.ErrorMessage = &errMsg
	} else {
		logEntry.Status = "sent"
	}

	if err := d.logSvc.Create(logEntry); err != nil {
		log.Printf("[email] error logging send attempt: %v", err)
	}
}

// resolveRecipientsWithLang determines recipients with their preferred language.
func (d *Dispatcher) resolveRecipientsWithLang(action string, rule models.EmailRule, payload events.Payload) []recipientInfo {
	switch rule.RecipientType {
	case "actor":
		if email, ok := payload["actor_email"].(string); ok && email != "" {
			langID := d.lookupUserLangByEmail(email)
			return []recipientInfo{{email: email, languageID: langID}}
		}
	case "node_author":
		if email, ok := payload["author_email"].(string); ok && email != "" {
			langID := d.lookupUserLangByEmail(email)
			return []recipientInfo{{email: email, languageID: langID}}
		}
	case "fixed":
		// Fixed emails have no user — use actor's language as best guess, then nil.
		var actorLang *int
		if email, ok := payload["actor_email"].(string); ok && email != "" {
			actorLang = d.lookupUserLangByEmail(email)
		}
		emails := splitEmails(rule.RecipientValue)
		infos := make([]recipientInfo, 0, len(emails))
		for _, e := range emails {
			infos = append(infos, recipientInfo{email: e, languageID: actorLang})
		}
		return infos
	case "role":
		return d.resolveRoleRecipientsWithLang(rule.RecipientValue, action)
	}
	return nil
}

// lookupUserLangByEmail finds a user's preferred language_id by email.
func (d *Dispatcher) lookupUserLangByEmail(email string) *int {
	var user models.User
	if err := d.db.Select("language_id").Where("email = ?", email).First(&user).Error; err == nil {
		return user.LanguageID
	}
	return nil
}

// resolveRoleRecipientsWithLang finds users with the given role slug whose role capabilities
// include the current action in the email_subscriptions array.
func (d *Dispatcher) resolveRoleRecipientsWithLang(roleSlug string, action string) []recipientInfo {
	var role models.Role
	if err := d.db.Where("slug = ?", roleSlug).First(&role).Error; err != nil {
		log.Printf("[email] role %q not found: %v", roleSlug, err)
		return nil
	}

	var caps map[string]interface{}
	if err := json.Unmarshal([]byte(role.Capabilities), &caps); err != nil {
		log.Printf("[email] error parsing capabilities for role %q: %v", roleSlug, err)
		return nil
	}

	subs, ok := caps["email_subscriptions"]
	if !ok {
		return nil
	}
	subsSlice, ok := subs.([]interface{})
	if !ok {
		return nil
	}

	found := false
	for _, s := range subsSlice {
		if str, ok := s.(string); ok && str == action {
			found = true
			break
		}
	}
	if !found {
		return nil
	}

	var users []models.User
	if err := d.db.Where("role_id = ?", role.ID).Find(&users).Error; err != nil {
		log.Printf("[email] error finding users for role %q: %v", roleSlug, err)
		return nil
	}

	infos := make([]recipientInfo, 0, len(users))
	for _, u := range users {
		if u.Email != "" {
			infos = append(infos, recipientInfo{email: u.Email, languageID: u.LanguageID})
		}
	}
	return infos
}

// splitEmails splits a comma-separated string of emails and trims whitespace.
func splitEmails(value string) []string {
	parts := strings.Split(value, ",")
	emails := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			emails = append(emails, trimmed)
		}
	}
	return emails
}

// renderTemplate parses and executes a Go html/template string with the given data.
func renderTemplate(name string, tmplStr string, data interface{}) (string, error) {
	t, err := htmltemplate.New(name).Parse(tmplStr)
	if err != nil {
		return "", fmt.Errorf("template parse error: %w", err)
	}
	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("template execute error: %w", err)
	}
	return buf.String(), nil
}
