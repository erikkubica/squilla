package db

import (
	"fmt"

	"gorm.io/gorm"

	"squilla/internal/models"
)

// This file owns the layout-related seeders: layout blocks for
// header/footer/etc. partials, and the default layout that wires
// everything together. Long enough on its own to warrant its own file.

func seedLayoutBlocks(db *gorm.DB) error {
	blocks := []models.LayoutBlock{
		{
			Slug:         "primary-nav",
			Name:         "Primary Navigation",
			Description:  "Main navigation menu with dropdown support (uses main-nav menu)",
			LanguageID:   nil,
			TemplateCode: primaryNavTemplate,
			Source:       "seed",
		},
		{
			Slug:         "user-menu",
			Name:         "User Menu",
			Description:  "Login/register or dashboard/logout based on auth state",
			LanguageID:   nil,
			TemplateCode: userMenuTemplate,
			Source:       "seed",
		},
		{
			Slug:         "site-header",
			Name:         "Site Header",
			Description:  "Full site header — includes primary-nav and user-menu blocks",
			LanguageID:   nil,
			TemplateCode: siteHeaderTemplate,
			Source:       "seed",
		},
		{
			Slug:         "footer-nav",
			Name:         "Footer Navigation",
			Description:  "Footer links from footer-nav menu",
			LanguageID:   nil,
			TemplateCode: footerNavTemplate,
			Source:       "seed",
		},
		{
			Slug:         "site-footer",
			Name:         "Site Footer",
			Description:  "Site footer with copyright and footer-nav block",
			LanguageID:   nil,
			TemplateCode: siteFooterTemplate,
			Source:       "seed",
		},
	}

	for _, block := range blocks {
		var existing models.LayoutBlock
		result := db.Where("slug = ? AND language_id IS NULL", block.Slug).First(&existing)
		if result.Error == nil {
			// If theme owns this block, don't overwrite
			if existing.Source == "theme" {
				continue
			}
			// Update existing custom block with the latest template
			db.Model(&existing).Updates(map[string]interface{}{
				"name":          block.Name,
				"description":   block.Description,
				"template_code": block.TemplateCode,
			})
		} else {
			if err := db.Create(&block).Error; err != nil {
				return fmt.Errorf("failed to seed layout block %q: %w", block.Slug, err)
			}
		}
	}
	return nil
}

func seedDefaultLayout(db *gorm.DB) error {
	layout := models.Layout{
		Slug:         "default",
		Name:         "Default Layout",
		Description:  "Default page layout with header, footer, and Tailwind CSS",
		LanguageID:   nil,
		TemplateCode: defaultLayoutTemplate,
		Source:       "seed",
		IsDefault:    true,
	}

	var existing models.Layout
	result := db.Where("slug = ? AND language_id IS NULL", layout.Slug).First(&existing)
	if result.Error == nil {
		// If theme owns this layout, don't overwrite
		if existing.Source == "theme" {
			return nil
		}
		// Update existing seed/custom layout
		db.Model(&existing).Updates(map[string]interface{}{
			"name":          layout.Name,
			"description":   layout.Description,
			"template_code": layout.TemplateCode,
			"is_default":    layout.IsDefault,
			"source":        layout.Source,
		})
	} else {
		if err := db.Create(&layout).Error; err != nil {
			return fmt.Errorf("failed to seed default layout: %w", err)
		}
	}
	return nil
}

// --- Auth block HTML templates ---
// These use Alpine.js to read flash cookies client-side since content blocks
// don't have access to Go request context.

const flashAlpineSnippet = `x-data="{
    flash: '', flashType: '',
    init() {
        const msg = this.getCookie('flash_msg');
        const typ = this.getCookie('flash_type');
        if (msg) { this.flash = decodeURIComponent(msg); this.flashType = typ || 'error'; this.clearCookies(); }
    },
    getCookie(n) { const m = document.cookie.match('(^|;)\\\\s*'+n+'=([^;]+)'); return m ? m[2] : ''; },
    clearCookies() { document.cookie='flash_msg=;path=/;max-age=0'; document.cookie='flash_type=;path=/;max-age=0'; }
}"`

const loginFormTemplate = `<div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full" ` + flashAlpineSnippet + `>
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-slate-900">Sign In</h1>
            <p class="mt-2 text-sm text-slate-600">Sign in to your account</p>
        </div>

        <template x-if="flash">
            <div class="mb-4 rounded-md p-4" :class="flashType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                <p class="text-sm" :class="flashType === 'success' ? 'text-green-800' : 'text-red-800'" x-text="flash"></p>
            </div>
        </template>

        <div class="bg-white shadow-md rounded-lg px-8 py-8">
            <form method="POST" action="/auth/login-page" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-medium text-slate-700">Email address</label>
                    <input id="email" name="email" type="email" autocomplete="email" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="you@example.com">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
                    <input id="password" name="password" type="password" autocomplete="current-password" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter your password">
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <input id="remember" name="remember" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                        <label for="remember" class="ml-2 block text-sm text-slate-700">Remember me</label>
                    </div>
                    <a href="/forgot-password" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">Forgot password?</a>
                </div>
                <button type="submit" class="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200">Sign In</button>
            </form>
        </div>
        <p class="mt-6 text-center text-sm text-slate-600">Don't have an account? <a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">Register</a></p>
    </div>
</div>`

const registerFormTemplate = `<div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full" ` + flashAlpineSnippet + `>
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-slate-900">Create Account</h1>
            <p class="mt-2 text-sm text-slate-600">Create your account</p>
        </div>

        <template x-if="flash">
            <div class="mb-4 rounded-md p-4" :class="flashType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                <p class="text-sm" :class="flashType === 'success' ? 'text-green-800' : 'text-red-800'" x-text="flash"></p>
            </div>
        </template>

        <div class="bg-white shadow-md rounded-lg px-8 py-8">
            <form method="POST" action="/auth/register" class="space-y-6">
                <div>
                    <label for="full_name" class="block text-sm font-medium text-slate-700">Full Name</label>
                    <input id="full_name" name="full_name" type="text" autocomplete="name" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Jane Doe">
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-slate-700">Email address</label>
                    <input id="email" name="email" type="email" autocomplete="email" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="you@example.com">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
                    <input id="password" name="password" type="password" autocomplete="new-password" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Create a password">
                </div>
                <div>
                    <label for="password_confirm" class="block text-sm font-medium text-slate-700">Confirm Password</label>
                    <input id="password_confirm" name="password_confirm" type="password" autocomplete="new-password" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Confirm your password">
                </div>
                <button type="submit" class="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200">Create Account</button>
            </form>
        </div>
        <p class="mt-6 text-center text-sm text-slate-600">Already have an account? <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">Sign In</a></p>
    </div>
</div>`

const forgotPasswordFormTemplate = `<div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full" ` + flashAlpineSnippet + `>
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-slate-900">Forgot Password</h1>
            <p class="mt-2 text-sm text-slate-600">Reset your password</p>
        </div>

        <template x-if="flash">
            <div class="mb-4 rounded-md p-4" :class="flashType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                <p class="text-sm" :class="flashType === 'success' ? 'text-green-800' : 'text-red-800'" x-text="flash"></p>
            </div>
        </template>

        <div class="bg-white shadow-md rounded-lg px-8 py-8">
            <p class="text-sm text-slate-600 mb-6">Enter your email address and we'll send you a link to reset your password.</p>
            <form method="POST" action="/auth/forgot-password" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-medium text-slate-700">Email address</label>
                    <input id="email" name="email" type="email" autocomplete="email" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="you@example.com">
                </div>
                <button type="submit" class="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200">Send Reset Link</button>
            </form>
        </div>
        <p class="mt-6 text-center text-sm text-slate-600"><a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">Back to Sign In</a></p>
    </div>
</div>`

const resetPasswordFormTemplate = `<div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full" ` + flashAlpineSnippet + `>
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-slate-900">Reset Password</h1>
            <p class="mt-2 text-sm text-slate-600">Set a new password</p>
        </div>

        <template x-if="flash">
            <div class="mb-4 rounded-md p-4" :class="flashType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                <p class="text-sm" :class="flashType === 'success' ? 'text-green-800' : 'text-red-800'" x-text="flash"></p>
            </div>
        </template>

        <div class="bg-white shadow-md rounded-lg px-8 py-8">
            <form method="POST" action="/auth/reset-password" class="space-y-6" x-data x-init="$el.querySelector('[name=token]').value = new URLSearchParams(location.search).get('token') || ''">
                <input type="hidden" name="token" value="">
                <div>
                    <label for="password" class="block text-sm font-medium text-slate-700">New Password</label>
                    <input id="password" name="password" type="password" autocomplete="new-password" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter new password">
                </div>
                <div>
                    <label for="password_confirm" class="block text-sm font-medium text-slate-700">Confirm New Password</label>
                    <input id="password_confirm" name="password_confirm" type="password" autocomplete="new-password" required
                        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Confirm new password">
                </div>
                <button type="submit" class="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200">Reset Password</button>
            </form>
        </div>
    </div>
</div>`

