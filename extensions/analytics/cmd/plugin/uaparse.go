package main

import (
	"strconv"
	"strings"
)

// browserRule maps a UA token to a browser name; first match wins, so
// specific forks and in-app browsers come before the engines they embed.
type browserRule struct{ token, name string }

var browserRules = []browserRule{
	{"instagram", "Instagram in-app"},
	{"fban/", "Facebook in-app"}, {"fbav/", "Facebook in-app"}, {"fb_iab", "Facebook in-app"},
	{"musical_ly", "TikTok in-app"}, {"bytedancewebview", "TikTok in-app"}, {"tiktok", "TikTok in-app"},
	{"zalo", "Zalo in-app"},
	{" line/", "LINE in-app"},
	{"micromessenger", "WeChat in-app"},
	{"linkedinapp", "LinkedIn in-app"},
	{"pinterest/", "Pinterest in-app"},
	{"snapchat", "Snapchat in-app"},
	{"edg/", "Edge"}, {"edga/", "Edge"}, {"edgios/", "Edge"}, {"edge/", "Edge"},
	{"opr/", "Opera"}, {"opt/", "Opera"}, {"opera", "Opera"},
	{"samsungbrowser", "Samsung Internet"},
	{"ucbrowser", "UC Browser"},
	{"yabrowser", "Yandex Browser"},
	{"coc_coc_browser", "Coc Coc"},
	{"vivaldi", "Vivaldi"},
	{"duckduckgo/", "DuckDuckGo"},
	{"miuibrowser", "Mi Browser"},
	{"huaweibrowser", "Huawei Browser"},
	{"silk/", "Silk"},
	{"fxios", "Firefox"}, {"firefox/", "Firefox"},
	{"crios", "Chrome"},
	{"msie ", "Internet Explorer"}, {"trident/", "Internet Explorer"},
}

// parseUA returns browser, OS and device class (mobile|tablet|desktop).
// Client hints (Sec-CH-UA-Mobile / -Platform) win over UA sniffing because
// Chromium freezes the UA string.
func parseUA(ua, chMobile, chPlatform string) (browser, os, device string) {
	l := strings.ToLower(ua)
	browser = detectBrowser(l)
	os = detectOS(l, chPlatform)
	device = detectDevice(l, chMobile)
	return
}

func detectBrowser(l string) string {
	if l == "" {
		return ""
	}
	for _, r := range browserRules {
		if strings.Contains(l, r.token) {
			return r.name
		}
	}
	switch {
	case strings.Contains(l, "; wv)") && strings.Contains(l, "chrome/"):
		return "Android WebView"
	case strings.Contains(l, "chrome/") || strings.Contains(l, "chromium/"):
		return "Chrome"
	case strings.Contains(l, "safari/") && strings.Contains(l, "version/"):
		return "Safari"
	case strings.Contains(l, "applewebkit") && (strings.Contains(l, "iphone") || strings.Contains(l, "ipad")):
		return "iOS WebView"
	}
	return "Other"
}

func detectOS(l, chPlatform string) string {
	switch strings.ToLower(strings.Trim(strings.TrimSpace(chPlatform), `"`)) {
	case "windows":
		return "Windows"
	case "macos":
		return "macOS"
	case "android":
		return "Android"
	case "ios":
		return "iOS"
	case "chrome os", "chromeos":
		return "ChromeOS"
	case "linux":
		return "Linux"
	}
	switch {
	case l == "":
		return ""
	case strings.Contains(l, "windows phone"):
		return "Windows Phone"
	case strings.Contains(l, "windows"):
		return "Windows"
	case strings.Contains(l, "iphone") || strings.Contains(l, "ipod"):
		return "iOS"
	case strings.Contains(l, "ipad"):
		return "iPadOS"
	case strings.Contains(l, "harmonyos"):
		return "HarmonyOS"
	case strings.Contains(l, "android"):
		return "Android"
	case strings.Contains(l, "cros"):
		return "ChromeOS"
	case strings.Contains(l, "mac os x") || strings.Contains(l, "macintosh"):
		return "macOS"
	case strings.Contains(l, "kaios"):
		return "KaiOS"
	case strings.Contains(l, "linux") || strings.Contains(l, "x11"):
		return "Linux"
	}
	return "Other"
}

func detectDevice(l, chMobile string) string {
	if l == "" {
		return ""
	}
	tablet := strings.Contains(l, "ipad") || strings.Contains(l, "tablet") || strings.Contains(l, "kindle") ||
		strings.Contains(l, "silk/") || (strings.Contains(l, "android") && !strings.Contains(l, "mobile"))
	if tablet {
		return "tablet"
	}
	if strings.TrimSpace(chMobile) == "?1" || strings.Contains(l, "mobi") || strings.Contains(l, "iphone") ||
		strings.Contains(l, "ipod") || strings.Contains(l, "windows phone") {
		return "mobile"
	}
	return "desktop"
}

// majorVersion returns the integer after token (e.g. "chrome/") or -1.
func majorVersion(l, token string) int {
	i := strings.Index(l, token)
	if i < 0 {
		return -1
	}
	rest := l[i+len(token):]
	end := 0
	for end < len(rest) && rest[end] >= '0' && rest[end] <= '9' {
		end++
	}
	if end == 0 {
		return -1
	}
	n, err := strconv.Atoi(rest[:end])
	if err != nil {
		return -1
	}
	return n
}
