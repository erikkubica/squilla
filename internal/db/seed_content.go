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
