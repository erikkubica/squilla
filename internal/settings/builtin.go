package settings

// RegisterBuiltins installs the kernel-owned settings schemas. Called
// from main.go at boot, after the registry is constructed and before
// the HTTP routes are mounted. Extension schemas are registered
// separately at extension activation time.
//
// Translatability rules of thumb:
//   - Identity / SEO copy → translatable (per-language).
//   - Code injection → per-language (operators may want different
//     analytics IDs per locale, e.g. for region-specific GA properties).
//   - Security policy → global (allowing self-registration on /en but
//     not /sk would be a footgun).
//   - Homepage selection → translatable (each locale has its own
//     landing page).
func RegisterBuiltins(r *Registry) {
	r.MustRegister(security())
	r.MustRegister(siteGeneral())
	r.MustRegister(siteSEO())
	r.MustRegister(siteAdvanced())
	r.MustRegister(siteRobots())
}

func security() Schema {
	return Schema{
		ID:          "security",
		Title:       "Security Settings",
		Description: "Authentication and registration policy. These settings apply to every language.",
		Capability:  "manage_settings",
		Sections: []Section{
			{
				Title:       "Public Registration",
				Icon:        "Shield",
				Description: "Allow visitors to create their own accounts via /register.",
				Fields: []Field{
					{
						Key:        "allow_registration",
						Label:      "Allow self-registration",
						Type:       "toggle",
						TrueValue:  "true",
						FalseValue: "false",
						Default:    "false",
						Help:       "When off, /register returns a disabled message and no account is created.",
					},
					{
						Key:         "default_registration_role",
						Label:       "Default role",
						Type:        "role_select",
						Placeholder: "Select a role...",
						Default:     "member",
						Help:        "Role assigned to self-registered users. Pick the lowest-privilege role that fits (default: member).",
						Warning:     "Avoid assigning admin_access roles here — anyone who registers gets the role automatically.",
					},
				},
			},
		},
	}
}

func siteGeneral() Schema {
	return Schema{
		ID:          "site.general",
		Title:       "General",
		Description: "Identity and homepage",
		Capability:  "manage_settings",
		Sections: []Section{
			{
				Title:       "General",
				Icon:        "Globe",
				Description: "Basic site identity",
				Fields: []Field{
					{Key: "site_name", Label: "Site Name", Type: "text", Translatable: true, Placeholder: "My Website"},
					{Key: "site_url", Label: "Site URL", Type: "text", Translatable: true, Placeholder: "https://example.com",
						Help: "Used for sitemaps, canonical URLs, and absolute links"},
					{Key: "site_description", Label: "Site Description", Type: "textarea", Translatable: true, Rows: 2,
						Placeholder: "A short description of your website..."},
				},
			},
			{
				Title:       "Homepage",
				Icon:        "Home",
				Description: "Choose which page visitors see first",
				Fields: []Field{
					{Key: "homepage_node_id", Label: "Homepage", Type: "node_select", Translatable: true,
						NodeType: "page", EmptyLabel: "No homepage set", Placeholder: "Select a page...",
						Help: "This page will be displayed when visitors access your site root"},
				},
			},
		},
	}
}

func siteSEO() Schema {
	return Schema{
		ID:          "site.seo",
		Title:       "SEO",
		Description: "Search engine and social-card defaults",
		Capability:  "manage_settings",
		Sections: []Section{
			{
				Title:       "SEO",
				Icon:        "Globe",
				Description: "Site-wide SEO defaults. Per-node SEO settings always win.",
				FullWidth:   true,
				Fields: []Field{
					{Key: "seo_default_meta_title", Label: "Default Meta Title", Type: "text", Translatable: true,
						Placeholder: "Site title fallback",
						Help:        "Used when a page has no Meta Title set. ≤60 chars recommended."},
					{Key: "seo_default_meta_description", Label: "Default Meta Description", Type: "textarea", Translatable: true,
						Rows: 2, Placeholder: "Brief site description",
						Help: "Fallback meta description. ≤160 chars recommended."},
					{Key: "seo_default_og_image", Label: "Default OG Image", Type: "text", Translatable: true,
						Placeholder: "https://example.com/og.png", FontMono: true,
						Help: "Fallback for og:image / twitter:image when a page has no featured image. 1200×630 recommended."},
					{Key: "seo_og_site_name", Label: "OG Site Name", Type: "text", Translatable: true,
						Placeholder: "Defaults to Site Name",
						Help:        "Emitted as og:site_name. Falls back to Site Name when blank."},
					{Key: "seo_twitter_handle", Label: "Twitter Handle", Type: "text", Translatable: true,
						Placeholder: "@yoursite", Help: "Emitted as twitter:site for cards."},
					{Key: "seo_robots_index", Label: "Allow search engines to index this site", Type: "toggle",
						Translatable: true, TrueValue: "true", FalseValue: "false", Default: "true",
						Help:    "When off, every public page emits noindex,nofollow (and the X-Robots-Tag header). Use OFF during staging.",
						Warning: "This setting is per-language. To hide the entire site from search, switch the language picker and toggle this OFF for every active language."},
				},
			},
		},
	}
}

func siteRobots() Schema {
	return Schema{
		ID:          "site.robots",
		Title:       "Robots & AI Crawlers",
		Description: "Controls /robots.txt — what classic search engines and AI crawlers may do with your content. The SEO indexing master switch (Site Settings → SEO) overrides everything here when off.",
		Capability:  "manage_settings",
		Sections: []Section{
			{
				Title:       "AI Crawler Policy",
				Icon:        "Shield",
				Description: "Two distinct cohorts. Training crawlers feed model corpora (your content shapes the next model). Search crawlers fetch live when a user asks an AI assistant a question (your content gets cited).",
				Fields: []Field{
					{
						Key:        "robots_allow_ai_training",
						Label:      "Allow AI training crawlers",
						Type:       "toggle",
						TrueValue:  "true",
						FalseValue: "false",
						Default:    "true",
						Help:       "Off blocks GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Meta-ExternalAgent, Bytespider, Amazonbot, and ~15 other training crawlers.",
						Warning:    "Training opt-out is best-effort: it relies on each vendor honouring robots.txt. Sticky badges only — no enforcement.",
					},
					{
						Key:        "robots_allow_ai_search",
						Label:      "Allow AI answer-engine crawlers",
						Type:       "toggle",
						TrueValue:  "true",
						FalseValue: "false",
						Default:    "true",
						Help:       "Off blocks ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User, MistralAI-User, DuckAssistBot, etc. Turning this off means AI assistants can't cite your pages live.",
					},
				},
			},
			{
				Title:       "Custom Rules",
				Icon:        "FileText",
				Description: "Operator escape hatch. Paths to disallow for everyone, plus a free-text block appended verbatim.",
				FullWidth:   true,
				Fields: []Field{
					{
						Key:         "robots_disallow_paths",
						Label:       "Additional Disallow paths",
						Type:        "textarea",
						Rows:        4,
						FontMono:    true,
						Placeholder: "/private/\n/internal/\n/search?",
						Help:        "One path per line. Appended to the User-agent: * block alongside the built-in /admin, /auth, /api defaults.",
					},
					{
						Key:         "robots_custom",
						Label:       "Custom robots.txt block",
						Type:        "textarea",
						Rows:        6,
						FontMono:    true,
						Placeholder: "# Slow this one bot down\nUser-agent: SpecialBot\nCrawl-delay: 10",
						Help:        "Appended verbatim at the end. Use for vendor-specific directives, Crawl-delay, or comments. No parsing — typos go straight to crawlers.",
					},
					{
						Key:         "robots_sitemap_url",
						Label:       "Sitemap URL override",
						Type:        "text",
						FontMono:    true,
						Placeholder: "https://example.com/sitemap.xml",
						Help:        "Defaults to <site_url>/sitemap.xml. Override if your sitemap lives elsewhere (e.g. a CDN or a sub-path).",
					},
				},
			},
		},
	}
}

func siteAdvanced() Schema {
	return Schema{
		ID:          "site.advanced",
		Title:       "Advanced",
		Description: "Custom code injection",
		Capability:  "manage_settings",
		Sections: []Section{
			{
				Title:       "Code Injection",
				Icon:        "FileText",
				Description: "Add custom code to your site's <head> section",
				FullWidth:   true,
				Fields: []Field{
					{Key: "analytics_code", Label: "Analytics Code", Type: "textarea", Translatable: true,
						Rows: 5, FontMono: true, Placeholder: "<!-- Google Analytics, Plausible, etc. -->",
						Help: "Injected into <head> on every public page"},
					{Key: "custom_head_code", Label: "Custom Head Code", Type: "textarea", Translatable: true,
						Rows: 5, FontMono: true, Placeholder: "<!-- Custom meta tags, fonts, etc. -->",
						Help: "Injected into <head> on every public page"},
					{Key: "custom_footer_code", Label: "Footer Code", Type: "textarea", Translatable: true,
						Rows: 5, FontMono: true, Placeholder: "<!-- Chat widgets, tracking pixels, etc. -->",
						Help: "Injected before </body> on every public page"},
				},
			},
		},
	}
}
