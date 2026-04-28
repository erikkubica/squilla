package db

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"

	"squilla/internal/models"
)

// This file owns the content seeders: auth-page block types,
// auth pages themselves, email templates, email rules, and the
// primary navigation menu.

func seedAuthBlockTypes(db *gorm.DB) error {
	blockTypes := []models.BlockType{
		{
			Slug:         "login-form",
			Label:        "Login Form",
			Icon:         "log-in",
			Description:  "User login form with email and password fields",
			FieldSchema:  models.JSONB(json.RawMessage(`[]`)),
			HTMLTemplate: loginFormTemplate,
			Source:       "system",
		},
		{
			Slug:         "register-form",
			Label:        "Registration Form",
			Icon:         "user-plus",
			Description:  "User registration form with name, email, and password fields",
			FieldSchema:  models.JSONB(json.RawMessage(`[]`)),
			HTMLTemplate: registerFormTemplate,
			Source:       "system",
		},
		{
			Slug:         "forgot-password-form",
			Label:        "Forgot Password Form",
			Icon:         "key",
			Description:  "Password reset request form",
			FieldSchema:  models.JSONB(json.RawMessage(`[]`)),
			HTMLTemplate: forgotPasswordFormTemplate,
			Source:       "system",
		},
		{
			Slug:         "reset-password-form",
			Label:        "Reset Password Form",
			Icon:         "lock",
			Description:  "Set new password form (used with reset token)",
			FieldSchema:  models.JSONB(json.RawMessage(`[]`)),
			HTMLTemplate: resetPasswordFormTemplate,
			Source:       "system",
		},
	}

	for _, bt := range blockTypes {
		var existing models.BlockType
		result := db.Where("slug = ?", bt.Slug).First(&existing)
		if result.Error == nil {
			db.Model(&existing).Updates(map[string]interface{}{
				"label":         bt.Label,
				"icon":          bt.Icon,
				"description":   bt.Description,
				"html_template": bt.HTMLTemplate,
				"source":        bt.Source,
			})
		} else {
			if err := db.Create(&bt).Error; err != nil {
				return fmt.Errorf("failed to seed auth block type %q: %w", bt.Slug, err)
			}
		}
	}
	return nil
}

func seedAuthPages(db *gorm.DB) error {
	now := time.Now()

	pages := []struct {
		slug      string
		fullURL   string
		title     string
		blockType string
		seoTitle  string
	}{
		{"login", "/login", "Sign In", "login-form", "Sign In"},
		{"register", "/register", "Create Account", "register-form", "Create Account"},
		{"forgot-password", "/forgot-password", "Forgot Password", "forgot-password-form", "Forgot Password"},
		{"reset-password", "/reset-password", "Reset Password", "reset-password-form", "Reset Password"},
	}

	for _, p := range pages {
		blocksData := json.RawMessage(fmt.Sprintf(`[{"type":"%s","fields":{}}]`, p.blockType))
		seoSettings := json.RawMessage(fmt.Sprintf(`{"meta_title":"%s"}`, p.seoTitle))

		node := models.ContentNode{
			NodeType:     "page",
			Status:       "published",
			LanguageCode: "en",
			Slug:         p.slug,
			FullURL:      p.fullURL,
			Title:        p.title,
			BlocksData:   models.JSONB(blocksData),
			SeoSettings:  models.JSONB(seoSettings),
			Version:      1,
			PublishedAt:  &now,
		}

		result := db.Where("full_url = ?", node.FullURL).FirstOrCreate(&node)
		if result.Error != nil {
			return fmt.Errorf("failed to seed auth page %q: %w", p.slug, result.Error)
		}
	}
	return nil
}

func seedEmailTemplates(db *gorm.DB) error {
	templates := []models.EmailTemplate{
		{
			Slug:            "welcome",
			Name:            "Welcome Email",
			SubjectTemplate: "Welcome to {{.site_name}}",
			BodyTemplate: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>Welcome, {{.user_full_name}}!</h2>
<p>Your account has been created on <strong>{{.site_name}}</strong>.</p>
<p>You can log in at: <a href="{{.site_url}}/login">{{.site_url}}/login</a></p>
</div>`,
			TestData: models.JSONB(`{"site_name":"Squilla","site_url":"http://localhost:8099","user_full_name":"Jane Doe","user_email":"jane@example.com"}`),
		},
		{
			Slug:            "user-registered-admin",
			Name:            "New User Registered (Admin)",
			SubjectTemplate: "New user registered: {{.user_full_name}}",
			BodyTemplate: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>New User Registration</h2>
<p>A new user has registered on <strong>{{.site_name}}</strong>.</p>
<table style="border-collapse: collapse; margin: 16px 0;">
<tr><td style="padding: 4px 12px 4px 0; color: #666;">Name:</td><td>{{.user_full_name}}</td></tr>
<tr><td style="padding: 4px 12px 4px 0; color: #666;">Email:</td><td>{{.user_email}}</td></tr>
</table>
</div>`,
			TestData: models.JSONB(`{"site_name":"Squilla","user_full_name":"Jane Doe","user_email":"jane@example.com"}`),
		},
		{
			Slug:            "password-reset",
			Name:            "Password Reset",
			SubjectTemplate: "Reset your password on {{.site_name}}",
			BodyTemplate: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>Password Reset</h2>
<p>Hi {{.user_full_name}},</p>
<p>You requested a password reset for your account on <strong>{{.site_name}}</strong>.</p>
<p><a href="{{.reset_url}}" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
<p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
</div>`,
			TestData: models.JSONB(`{"site_name":"Squilla","user_full_name":"Jane Doe","reset_url":"http://localhost:8099/reset-password?token=abc123"}`),
		},
		{
			Slug:            "node-published",
			Name:            "Content Published",
			SubjectTemplate: "{{.node_title}} has been published",
			BodyTemplate: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>Content Published</h2>
<p>"<strong>{{.node_title}}</strong>" ({{.node_type}}) has been published on <strong>{{.site_name}}</strong>.</p>
<p><a href="{{.site_url}}{{.full_url}}">View it here</a></p>
</div>`,
			TestData: models.JSONB(`{"site_name":"Squilla","site_url":"http://localhost:8099","node_title":"Hello World","node_type":"post","full_url":"/hello-world"}`),
		},
		{
			Slug:            "node-created-admin",
			Name:            "New Content Created (Admin)",
			SubjectTemplate: "New {{.node_type}} created: {{.node_title}}",
			BodyTemplate: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>New Content Created</h2>
<p>A new <strong>{{.node_type}}</strong> has been created on <strong>{{.site_name}}</strong>.</p>
<table style="border-collapse: collapse; margin: 16px 0;">
<tr><td style="padding: 4px 12px 4px 0; color: #666;">Title:</td><td>{{.node_title}}</td></tr>
<tr><td style="padding: 4px 12px 4px 0; color: #666;">URL:</td><td>{{.site_url}}{{.full_url}}</td></tr>
</table>
</div>`,
			TestData: models.JSONB(`{"site_name":"Squilla","site_url":"http://localhost:8099","node_title":"Hello World","node_type":"post","full_url":"/hello-world"}`),
		},
	}

	for _, t := range templates {
		var existing models.EmailTemplate
		result := db.Where("slug = ?", t.Slug).First(&existing)
		if result.Error == nil {
			db.Model(&existing).Updates(map[string]interface{}{
				"name":             t.Name,
				"subject_template": t.SubjectTemplate,
				"body_template":    t.BodyTemplate,
				"test_data":        t.TestData,
			})
		} else {
			if err := db.Create(&t).Error; err != nil {
				return fmt.Errorf("failed to seed email template %q: %w", t.Slug, err)
			}
		}
	}
	return nil
}

func seedEmailRules(db *gorm.DB) error {
	// Look up template IDs
	var welcome, adminNotif, nodePublished, nodeCreatedAdmin, passwordReset models.EmailTemplate
	db.Where("slug = ?", "welcome").First(&welcome)
	db.Where("slug = ?", "user-registered-admin").First(&adminNotif)
	db.Where("slug = ?", "node-published").First(&nodePublished)
	db.Where("slug = ?", "node-created-admin").First(&nodeCreatedAdmin)
	db.Where("slug = ?", "password-reset").First(&passwordReset)

	if welcome.ID == 0 || adminNotif.ID == 0 || nodePublished.ID == 0 || nodeCreatedAdmin.ID == 0 {
		return nil // Templates not seeded yet, skip rules
	}

	rules := []models.EmailRule{
		{Action: "user.registered", TemplateID: welcome.ID, RecipientType: "actor", RecipientValue: "", Enabled: true},
		{Action: "user.registered", TemplateID: adminNotif.ID, RecipientType: "role", RecipientValue: "admin", Enabled: true},
		{Action: "node.published", TemplateID: nodePublished.ID, RecipientType: "node_author", RecipientValue: "", Enabled: true},
		{Action: "node.created", TemplateID: nodeCreatedAdmin.ID, RecipientType: "role", RecipientValue: "admin", Enabled: true},
	}
	if passwordReset.ID != 0 {
		rules = append(rules, models.EmailRule{
			Action:         "user.password_reset_requested",
			TemplateID:     passwordReset.ID,
			RecipientType:  "actor",
			RecipientValue: "",
			Enabled:        true,
		})
	}

	for _, r := range rules {
		var count int64
		db.Model(&models.EmailRule{}).Where("action = ? AND template_id = ? AND recipient_type = ?", r.Action, r.TemplateID, r.RecipientType).Count(&count)
		if count == 0 {
			if err := db.Create(&r).Error; err != nil {
				return fmt.Errorf("failed to seed email rule for %q: %w", r.Action, err)
			}
		}
	}
	return nil
}

func seedMenus(db *gorm.DB) error {
	menus := []struct {
		slug  string
		name  string
		items []models.MenuItem
	}{
		{
			slug: "main-nav",
			name: "Main Navigation",
			items: []models.MenuItem{
				{Title: "Home", ItemType: "custom", URL: "/", Target: "_self", SortOrder: 0},
				{Title: "About", ItemType: "custom", URL: "/about", Target: "_self", SortOrder: 1},
			},
		},
		{
			slug: "footer-nav",
			name: "Footer Navigation",
			items: []models.MenuItem{
				{Title: "Home", ItemType: "custom", URL: "/", Target: "_self", SortOrder: 0},
				{Title: "About", ItemType: "custom", URL: "/about", Target: "_self", SortOrder: 1},
				{Title: "Privacy", ItemType: "custom", URL: "/privacy", Target: "_self", SortOrder: 2},
				{Title: "Terms", ItemType: "custom", URL: "/terms", Target: "_self", SortOrder: 3},
			},
		},
	}

	for _, m := range menus {
		var existing models.Menu
		result := db.Where("slug = ? AND language_id IS NULL", m.slug).First(&existing)
		if result.Error == nil {
			var count int64
			db.Model(&models.MenuItem{}).Where("menu_id = ?", existing.ID).Count(&count)
			if count > 0 {
				continue
			}
			for i := range m.items {
				m.items[i].MenuID = existing.ID
				db.Create(&m.items[i])
			}
			continue
		}

		menu := models.Menu{Slug: m.slug, Name: m.name, LanguageID: nil, Version: 1}
		if err := db.Create(&menu).Error; err != nil {
			return fmt.Errorf("failed to seed menu %q: %w", m.slug, err)
		}
		for i := range m.items {
			m.items[i].MenuID = menu.ID
			if err := db.Create(&m.items[i]).Error; err != nil {
				return fmt.Errorf("failed to seed menu item %q: %w", m.items[i].Title, err)
			}
		}
	}
	return nil
}
