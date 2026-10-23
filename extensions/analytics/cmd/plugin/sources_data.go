package main

// Channels (stable API values).
const (
	chDirect        = "direct"
	chOrganicSearch = "organic_search"
	chPaidSearch    = "paid_search"
	chOrganicSocial = "organic_social"
	chPaidSocial    = "paid_social"
	chAI            = "ai"
	chEmail         = "email"
	chReferral      = "referral"
	chCampaign      = "campaign"
)

// Source kinds drive channel mapping.
const (
	srcSearch   = "search"
	srcSocial   = "social"
	srcAI       = "ai"
	srcEmail    = "email"
	srcReferral = "referral"
)

// sourceRule matches a referrer host. exact matches the whole host,
// suffix matches the host or any subdomain of it, label matches any host
// containing that DNS label (google → www.google.co.uk, google.com.vn).
// First match wins: specific hosts precede brand labels.
type sourceRule struct {
	exact, suffix, label string
	name, kind           string
}

var sourceRules = []sourceRule{
	// AI assistants and answer engines.
	{suffix: "chatgpt.com", name: "ChatGPT", kind: srcAI},
	{suffix: "chat.openai.com", name: "ChatGPT", kind: srcAI},
	{suffix: "perplexity.ai", name: "Perplexity", kind: srcAI},
	{suffix: "claude.ai", name: "Claude", kind: srcAI},
	{suffix: "gemini.google.com", name: "Gemini", kind: srcAI},
	{suffix: "bard.google.com", name: "Gemini", kind: srcAI},
	{suffix: "copilot.microsoft.com", name: "Copilot", kind: srcAI},
	{suffix: "copilot.cloud.microsoft", name: "Copilot", kind: srcAI},
	{suffix: "edgeservices.bing.com", name: "Copilot", kind: srcAI},
	{suffix: "poe.com", name: "Poe", kind: srcAI},
	{suffix: "you.com", name: "You.com", kind: srcAI},
	{suffix: "phind.com", name: "Phind", kind: srcAI},
	{suffix: "meta.ai", name: "Meta AI", kind: srcAI},
	{suffix: "deepseek.com", name: "DeepSeek", kind: srcAI},
	{suffix: "chat.mistral.ai", name: "Mistral", kind: srcAI},
	{suffix: "grok.com", name: "Grok", kind: srcAI},
	{suffix: "x.ai", name: "Grok", kind: srcAI},
	{suffix: "chat.qwen.ai", name: "Qwen", kind: srcAI},
	{suffix: "kimi.com", name: "Kimi", kind: srcAI},
	// Webmail.
	{suffix: "mail.google.com", name: "Gmail", kind: srcEmail},
	{suffix: "inbox.google.com", name: "Gmail", kind: srcEmail},
	{exact: "com.google.android.gm", name: "Gmail", kind: srcEmail},
	{suffix: "outlook.live.com", name: "Outlook", kind: srcEmail},
	{suffix: "outlook.office.com", name: "Outlook", kind: srcEmail},
	{suffix: "outlook.office365.com", name: "Outlook", kind: srcEmail},
	{suffix: "mail.yahoo.com", name: "Yahoo Mail", kind: srcEmail},
	{suffix: "mail.proton.me", name: "Proton Mail", kind: srcEmail},
	{suffix: "mail.zoho.com", name: "Zoho Mail", kind: srcEmail},
	{suffix: "mail.yandex.ru", name: "Yandex Mail", kind: srcEmail},
	// Search engines.
	{suffix: "search.brave.com", name: "Brave Search", kind: srcSearch},
	{suffix: "coccoc.com", name: "Coc Coc", kind: srcSearch},
	{exact: "com.google.android.googlequicksearchbox", name: "Google", kind: srcSearch},
	{suffix: "maps.google.com", name: "Google Maps", kind: srcSearch},
	{suffix: "docs.google.com", name: "Google Docs", kind: srcReferral},
	{suffix: "sites.google.com", name: "Google Sites", kind: srcReferral},
	{suffix: "translate.google.com", name: "Google Translate", kind: srcReferral},
	{suffix: "translate.goog", name: "Google Translate", kind: srcReferral},
	{label: "google", name: "Google", kind: srcSearch},
	{label: "bing", name: "Bing", kind: srcSearch},
	{label: "duckduckgo", name: "DuckDuckGo", kind: srcSearch},
	{label: "yahoo", name: "Yahoo", kind: srcSearch},
	{label: "yandex", name: "Yandex", kind: srcSearch},
	{suffix: "ya.ru", name: "Yandex", kind: srcSearch},
	{label: "baidu", name: "Baidu", kind: srcSearch},
	{label: "naver", name: "Naver", kind: srcSearch},
	{label: "ecosia", name: "Ecosia", kind: srcSearch},
	{label: "startpage", name: "Startpage", kind: srcSearch},
	{label: "qwant", name: "Qwant", kind: srcSearch},
	{label: "seznam", name: "Seznam", kind: srcSearch},
	{label: "sogou", name: "Sogou", kind: srcSearch},
	{suffix: "kagi.com", name: "Kagi", kind: srcSearch},
	{suffix: "ask.com", name: "Ask", kind: srcSearch},
	{suffix: "search.aol.com", name: "AOL", kind: srcSearch},
	{suffix: "mojeek.com", name: "Mojeek", kind: srcSearch},
	// Social networks and messengers.
	{label: "facebook", name: "Facebook", kind: srcSocial},
	{suffix: "fb.com", name: "Facebook", kind: srcSocial},
	{suffix: "fb.me", name: "Facebook", kind: srcSocial},
	{exact: "com.facebook.katana", name: "Facebook", kind: srcSocial},
	{suffix: "messenger.com", name: "Messenger", kind: srcSocial},
	{label: "instagram", name: "Instagram", kind: srcSocial},
	{exact: "com.instagram.android", name: "Instagram", kind: srcSocial},
	{suffix: "threads.net", name: "Threads", kind: srcSocial},
	{suffix: "threads.com", name: "Threads", kind: srcSocial},
	{label: "tiktok", name: "TikTok", kind: srcSocial},
	{suffix: "youtube.com", name: "YouTube", kind: srcSocial},
	{suffix: "youtu.be", name: "YouTube", kind: srcSocial},
	{suffix: "x.com", name: "X (Twitter)", kind: srcSocial},
	{suffix: "twitter.com", name: "X (Twitter)", kind: srcSocial},
	{exact: "t.co", name: "X (Twitter)", kind: srcSocial},
	{suffix: "linkedin.com", name: "LinkedIn", kind: srcSocial},
	{suffix: "lnkd.in", name: "LinkedIn", kind: srcSocial},
	{exact: "com.linkedin.android", name: "LinkedIn", kind: srcSocial},
	{suffix: "reddit.com", name: "Reddit", kind: srcSocial},
	{label: "pinterest", name: "Pinterest", kind: srcSocial},
	{suffix: "pin.it", name: "Pinterest", kind: srcSocial},
	{suffix: "whatsapp.com", name: "WhatsApp", kind: srcSocial},
	{suffix: "wa.me", name: "WhatsApp", kind: srcSocial},
	{exact: "com.whatsapp", name: "WhatsApp", kind: srcSocial},
	{suffix: "t.me", name: "Telegram", kind: srcSocial},
	{suffix: "telegram.org", name: "Telegram", kind: srcSocial},
	{suffix: "telegram.me", name: "Telegram", kind: srcSocial},
	{exact: "org.telegram.messenger", name: "Telegram", kind: srcSocial},
	{suffix: "zalo.me", name: "Zalo", kind: srcSocial},
	{suffix: "zaloapp.com", name: "Zalo", kind: srcSocial},
	{exact: "com.zing.zalo", name: "Zalo", kind: srcSocial},
	{suffix: "line.me", name: "LINE", kind: srcSocial},
	{suffix: "bsky.app", name: "Bluesky", kind: srcSocial},
	{suffix: "discord.com", name: "Discord", kind: srcSocial},
	{suffix: "slack.com", name: "Slack", kind: srcSocial},
	{exact: "com.slack", name: "Slack", kind: srcSocial},
	{suffix: "vk.com", name: "VK", kind: srcSocial},
	{suffix: "weibo.com", name: "Weibo", kind: srcSocial},
	{suffix: "quora.com", name: "Quora", kind: srcSocial},
	{suffix: "snapchat.com", name: "Snapchat", kind: srcSocial},
	{suffix: "tumblr.com", name: "Tumblr", kind: srcSocial},
	{suffix: "mastodon.social", name: "Mastodon", kind: srcSocial},
	// Travel marketplaces and review sites (referral channel).
	{label: "tripadvisor", name: "Tripadvisor", kind: srcReferral},
	{label: "getyourguide", name: "GetYourGuide", kind: srcReferral},
	{label: "viator", name: "Viator", kind: srcReferral},
	{label: "klook", name: "Klook", kind: srcReferral},
	{label: "booking", name: "Booking.com", kind: srcReferral},
	{label: "airbnb", name: "Airbnb", kind: srcReferral},
	{label: "agoda", name: "Agoda", kind: srcReferral},
	{label: "expedia", name: "Expedia", kind: srcReferral},
	{suffix: "trip.com", name: "Trip.com", kind: srcReferral},
}

// sourceAliases map common utm_source spellings to a known source rule host.
var sourceAliases = map[string]string{
	"ig": "instagram.com", "insta": "instagram.com", "instagram": "instagram.com",
	"fb": "facebook.com", "facebook": "facebook.com", "meta": "facebook.com",
	"tt": "tiktok.com", "tiktok": "tiktok.com", "yt": "youtube.com", "youtube": "youtube.com",
	"twitter": "twitter.com", "x": "x.com", "linkedin": "linkedin.com", "li": "linkedin.com",
	"reddit": "reddit.com", "pinterest": "pinterest.com", "whatsapp": "whatsapp.com", "wa": "whatsapp.com",
	"telegram": "telegram.org", "zalo": "zalo.me", "line": "line.me",
	"google": "google.com", "bing": "bing.com", "duckduckgo": "duckduckgo.com",
	"chatgpt": "chatgpt.com", "chatgpt.com": "chatgpt.com", "openai": "chatgpt.com",
	"perplexity": "perplexity.ai", "perplexity.ai": "perplexity.ai", "claude": "claude.ai", "gemini": "gemini.google.com",
	"copilot": "copilot.microsoft.com", "gmail": "mail.google.com", "outlook": "outlook.live.com",
	"tripadvisor": "tripadvisor.com", "getyourguide": "getyourguide.com", "viator": "viator.com", "klook": "klook.com",
}

// inAppRules detect in-app browsers, which usually send no referrer.
var inAppRules = []struct{ token, host string }{
	{"instagram", "instagram.com"},
	{"fban/", "facebook.com"}, {"fbav/", "facebook.com"}, {"fb_iab", "facebook.com"},
	{"musical_ly", "tiktok.com"}, {"bytedancewebview", "tiktok.com"}, {"tiktok", "tiktok.com"},
	{" line/", "line.me"},
	{"zalo", "zalo.me"},
	{"linkedinapp", "linkedin.com"},
	{"pinterest/", "pinterest.com"},
}
