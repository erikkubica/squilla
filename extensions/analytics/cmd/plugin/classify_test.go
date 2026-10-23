package main

import "testing"

const chromeUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

func browserHeaders(n string) string {
	return map[string]string{
		"accept": "text/html,*/*;q=0.8", "accept-language": "en", "sec-fetch-site": "none",
		"sec-fetch-mode": "navigate", "sec-fetch-dest": "document", "sec-ch-ua": `"Chromium";v="130"`,
	}[n]
}

func TestClassifyBotSignatures(t *testing.T) {
	cases := []struct{ ua, cat, name string }{
		{"Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)", botAIAssistant, "ChatGPT-User"},
		{"Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)", botAICrawler, "GPTBot"},
		{"Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", botAICrawler, "ClaudeBot"},
		{"Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)", botAISearch, "OAI-SearchBot"},
		{"Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0)", botAISearch, "PerplexityBot"},
		{"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", botSearch, "Googlebot"},
		{"Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", botSearch, "Bingbot"},
		{"Mozilla/5.0 (compatible; coccocbot-web/1.0; +http://help.coccoc.com/searchengine)", botSearch, "CocCocBot"},
		{"WhatsApp/2.23.20.0 A", botLinkPreview, "WhatsApp"},
		{"TelegramBot (like TwitterBot)", botLinkPreview, "Telegram"},
		{"facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", botLinkPreview, "Facebook"},
		{"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0", botLinkPreview, "iMessage"},
		{"ZaloPC-win32-24v1", botLinkPreview, "Zalo"},
		{"Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)", botSEOTool, "AhrefsBot"},
		{"Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)", botMonitor, "UptimeRobot"},
		{"curl/8.4.0", botHTTPClient, "curl"},
		{"python-requests/2.31.0", botHTTPClient, "python-requests"},
		{"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36", botHeadless, "HeadlessChrome"},
		{"Mozilla/5.0 (compatible; FooCrawler/1.0)", botOther, "foocrawler"},
		{"SomeTool/1.0", botHTTPClient, "sometool"},
		{"", botHTTPClient, "Empty user agent"},
	}
	for _, c := range cases {
		v := classifyBot(botContext{Method: "GET", Path: "/", UA: c.ua, Headers: browserHeaders, HTMLResult: true, SawSecFetch: true})
		if v.Category != c.cat || v.Name != c.name {
			t.Errorf("%q → %+v, want %s/%s", c.ua, v, c.cat, c.name)
		}
	}
}

func TestClassifyHumansAndInApp(t *testing.T) {
	humans := []string{
		chromeUA,
		"Mozilla/5.0 (Linux; Android 13; CUBOT KingKong) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/1 ZaloTheme/light",
		"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 WhatsApp/2.24",
	}
	for _, ua := range humans {
		if v := classifyBot(botContext{Method: "GET", Path: "/", UA: ua, Headers: browserHeaders, HTMLResult: true, SawSecFetch: true}); v.isBot() {
			t.Errorf("human %q classified as %+v", ua, v)
		}
	}
}

func TestClassifyHeuristicsAndProbes(t *testing.T) {
	noLang := func(n string) string {
		if n == "accept-language" {
			return ""
		}
		return browserHeaders(n)
	}
	starAccept := func(n string) string {
		if n == "accept" {
			return "*/*"
		}
		return browserHeaders(n)
	}
	noSecFetch := func(n string) string {
		return map[string]string{"accept": "text/html", "accept-language": "en"}[n]
	}
	noHints := func(n string) string {
		if n == "sec-ch-ua" {
			return ""
		}
		return browserHeaders(n)
	}
	cases := []struct {
		name    string
		ctx     botContext
		cat     string
		botName string
	}{
		{"probe wp", botContext{Method: "GET", Path: "/wp-login.php", UA: chromeUA, Headers: browserHeaders}, botProbe, "WordPress probe"},
		{"probe env", botContext{Method: "GET", Path: "/.env", UA: chromeUA, Headers: browserHeaders}, botProbe, "Secrets probe"},
		{"head", botContext{Method: "HEAD", Path: "/", UA: chromeUA, Headers: browserHeaders}, botMonitor, "HEAD request"},
		{"no accept-language", botContext{Method: "GET", Path: "/", UA: chromeUA, Headers: noLang, HTMLResult: true}, botOther, "No Accept-Language"},
		{"accept */*", botContext{Method: "GET", Path: "/", UA: chromeUA, Headers: starAccept, HTMLResult: true}, botHTTPClient, "Generic client (Accept */*)"},
		{"no sec-fetch on https site", botContext{Method: "GET", Path: "/", UA: chromeUA, Headers: noSecFetch, HTMLResult: true, SawSecFetch: true}, botHeadless, "Browser UA without Sec-Fetch"},
		{"no sec-fetch on http site", botContext{Method: "GET", Path: "/", UA: chromeUA, Headers: noSecFetch, HTMLResult: true}, "", ""},
		{"chromium without hints is human", botContext{Method: "GET", Path: "/", UA: chromeUA, Headers: noHints, HTMLResult: true, SawSecFetch: true}, "", ""},
	}
	for _, c := range cases {
		v := classifyBot(c.ctx)
		if v.Category != c.cat || v.Name != c.botName {
			t.Errorf("%s → %+v, want %s/%s", c.name, v, c.cat, c.botName)
		}
	}
}

func TestParseUA(t *testing.T) {
	cases := []struct{ ua, mobile, platform, browser, os, device string }{
		{chromeUA, "?0", `"Windows"`, "Chrome", "Windows", "desktop"},
		{"Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1", "", "", "Safari", "iOS", "mobile"},
		{"Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1", "", "", "Safari", "iPadOS", "tablet"},
		{"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36", "?1", `"Android"`, "Chrome", "Android", "mobile"},
		{"Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36", "", "", "Chrome", "Android", "tablet"},
		{"Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:131.0) Gecko/20100101 Firefox/131.0", "", "", "Firefox", "macOS", "desktop"},
		{"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0", "", "", "Edge", "Windows", "desktop"},
		{"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/128.0.0 Chrome/122.0.0.0 Safari/537.36", "", "", "Coc Coc", "Windows", "desktop"},
		{"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 307.0.0.34.111", "", "", "Instagram in-app", "iOS", "mobile"},
		{"Mozilla/5.0 (Linux; Android 13; SM-S911B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/440.0.0.0;]", "", "", "Facebook in-app", "Android", "mobile"},
		{"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36", "?0", `"macOS"`, "Chrome", "macOS", "desktop"},
	}
	for _, c := range cases {
		b, o, d := parseUA(c.ua, c.mobile, c.platform)
		if b != c.browser || o != c.os || d != c.device {
			t.Errorf("%q → %s/%s/%s, want %s/%s/%s", c.ua, b, o, d, c.browser, c.os, c.device)
		}
	}
}

func TestClassifyAcquisition(t *testing.T) {
	cases := []struct {
		name, ref, ua, query string
		source, channel      string
	}{
		{"direct", "", chromeUA, "", "", chDirect},
		{"google", "www.google.com.vn", chromeUA, "", "Google", chOrganicSearch},
		{"google maps", "maps.google.com", chromeUA, "", "Google Maps", chOrganicSearch},
		{"gmail", "mail.google.com", chromeUA, "", "Gmail", chEmail},
		{"chatgpt ref", "chatgpt.com", chromeUA, "", "ChatGPT", chAI},
		{"chatgpt utm", "", chromeUA, "utm_source=chatgpt.com", "ChatGPT", chAI},
		{"gemini", "gemini.google.com", chromeUA, "", "Gemini", chAI},
		{"facebook l.", "l.facebook.com", chromeUA, "fbclid=abc", "Facebook", chOrganicSocial},
		{"instagram in-app", "", "Mozilla/5.0 (iPhone) AppleWebKit Instagram 307.0", "", "Instagram", chOrganicSocial},
		{"zalo in-app", "", "Mozilla/5.0 (iPhone) AppleWebKit Zalo iOS/1", "", "Zalo", chOrganicSocial},
		{"tiktok in-app", "", "Mozilla/5.0 (Linux) AppleWebKit BytedanceWebview/d8a21c6", "", "TikTok", chOrganicSocial},
		{"whatsapp android", "com.whatsapp", chromeUA, "", "WhatsApp", chOrganicSocial},
		{"gclid", "www.google.com", chromeUA, "gclid=xyz", "Google", chPaidSearch},
		{"ttclid", "", chromeUA, "ttclid=1&utm_source=tiktok", "TikTok", chPaidSocial},
		{"paid social", "", chromeUA, "utm_source=ig&utm_medium=cpc", "Instagram", chPaidSocial},
		{"newsletter", "", chromeUA, "utm_source=brevo&utm_medium=email&utm_campaign=Oct", "brevo", chEmail},
		{"campaign", "", chromeUA, "utm_source=flyer&utm_campaign=hotel", "flyer", chCampaign},
		{"tripadvisor", "www.tripadvisor.com.vn", chromeUA, "", "Tripadvisor", chReferral},
		{"unknown referrer", "blog.example.org", chromeUA, "", "blog.example.org", chReferral},
		{"brand label is anchored", "booking.example.org", chromeUA, "", "booking.example.org", chReferral},
	}
	for _, c := range cases {
		a := classifyAcquisition(c.ref, c.ua, parseCampaign(c.query))
		if a.Source != c.source || a.Channel != c.channel {
			t.Errorf("%s → %q/%q, want %q/%q", c.name, a.Source, a.Channel, c.source, c.channel)
		}
	}
	if c := parseCampaign("gclid=secret&utm_campaign=Summer&other=x"); !c.Gclid || c.Name != "Summer" {
		t.Errorf("parseCampaign = %+v", c)
	}
}

func TestReferrerHost(t *testing.T) {
	own := []string{"beyondvietnam.com"}
	cases := map[string]string{
		"https://www.google.com/search?q=x":    "google.com",
		"https://example.com/other":            "",
		"https://www.example.com/":             "",
		"https://cdn.beyondvietnam.com/":       "",
		"android-app://com.google.android.gm/": "com.google.android.gm",
		"javascript:alert(1)":                  "",
		"":                                     "",
	}
	for in, want := range cases {
		if got := referrerHost(in, "example.com:443", own); got != want {
			t.Errorf("referrerHost(%q) = %q, want %q", in, got, want)
		}
	}
}
