package main

// Bot categories (stable API values; the admin UI labels them).
const (
	botSearch      = "search"
	botAICrawler   = "ai_crawler"
	botAISearch    = "ai_search"
	botAIAssistant = "ai_assistant"
	botLinkPreview = "link_preview"
	botSEOTool     = "seo_tool"
	botMonitor     = "monitor"
	botHTTPClient  = "http_client"
	botHeadless    = "headless"
	botProbe       = "probe"
	botOther       = "other"
)

// botSig matches a lower-case user-agent substring. The list is ordered:
// the first matching entry wins, so user-triggered AI agents and specific
// previews come before broad crawler tokens. Update this file to teach the
// classifier new agents — no other code changes are needed.
type botSig struct {
	token, name, category string
	// noBrowser restricts the match to UAs without a browser engine, for
	// apps whose in-app browser carries the same token as their fetcher.
	noBrowser bool
}

var botSignatures = []botSig{
	// AI assistants fetching a page because a user asked (not training).
	{"chatgpt-user", "ChatGPT-User", botAIAssistant, false},
	{"claude-user", "Claude-User", botAIAssistant, false},
	{"claude-web", "Claude-Web", botAIAssistant, false},
	{"perplexity-user", "Perplexity-User", botAIAssistant, false},
	{"mistralai-user", "MistralAI-User", botAIAssistant, false},
	{"meta-externalfetcher", "Meta-ExternalFetcher", botAIAssistant, false},
	{"google-read-aloud", "Google Read Aloud", botAIAssistant, false},
	{"cohere-ai", "Cohere", botAIAssistant, false},
	{"manus-user", "Manus", botAIAssistant, false},
	{"novaact", "Amazon Nova Act", botAIAssistant, false},
	// AI search indexes (answers with citations).
	{"oai-searchbot", "OAI-SearchBot", botAISearch, false},
	{"claude-searchbot", "Claude-SearchBot", botAISearch, false},
	{"perplexitybot", "PerplexityBot", botAISearch, false},
	{"duckassistbot", "DuckAssistBot", botAISearch, false},
	{"youbot", "YouBot", botAISearch, false},
	{"phindbot", "PhindBot", botAISearch, false},
	{"andibot", "AndiBot", botAISearch, false},
	{"linkupbot", "LinkupBot", botAISearch, false},
	{"kagibot", "Kagibot", botAISearch, false},
	// AI training crawlers.
	{"gptbot", "GPTBot", botAICrawler, false},
	{"claudebot", "ClaudeBot", botAICrawler, false},
	{"anthropic-ai", "Anthropic", botAICrawler, false},
	{"ccbot", "CCBot (Common Crawl)", botAICrawler, false},
	{"bytespider", "Bytespider", botAICrawler, false},
	{"meta-externalagent", "Meta-ExternalAgent", botAICrawler, false},
	{"facebookbot", "FacebookBot", botAICrawler, false},
	{"amazonbot", "Amazonbot", botAICrawler, false},
	{"applebot-extended", "Applebot-Extended", botAICrawler, false},
	{"google-extended", "Google-Extended", botAICrawler, false},
	{"cohere-training-data-crawler", "Cohere training crawler", botAICrawler, false},
	{"diffbot", "Diffbot", botAICrawler, false},
	{"imagesiftbot", "ImagesiftBot", botAICrawler, false},
	{"omgilibot", "Omgilibot", botAICrawler, false},
	{"omgili", "Omgili", botAICrawler, false},
	{"timpibot", "Timpibot", botAICrawler, false},
	{"ai2bot", "AI2Bot", botAICrawler, false},
	{"pangubot", "PanguBot", botAICrawler, false},
	{"kangaroo bot", "Kangaroo Bot", botAICrawler, false},
	{"webzio-extended", "Webzio-Extended", botAICrawler, false},
	{"img2dataset", "img2dataset", botAICrawler, false},
	{"friendlycrawler", "FriendlyCrawler", botAICrawler, false},
	{"iaskspider", "iAskSpider", botAICrawler, false},
	{"velenpublicwebcrawler", "VelenPublicWebCrawler", botAICrawler, false},
	{"scrapy", "Scrapy", botAICrawler, false},
	// Link previews ("Shares by app"). iMessage is detected separately.
	{"whatsapp", "WhatsApp", botLinkPreview, true},
	{"zalo", "Zalo", botLinkPreview, true},
	{"telegrambot", "Telegram", botLinkPreview, false},
	{"facebookexternalhit", "Facebook", botLinkPreview, false},
	{"facebot", "Facebook", botLinkPreview, false},
	{"twitterbot", "X (Twitter)", botLinkPreview, false},
	{"linkedinbot", "LinkedIn", botLinkPreview, false},
	{"slackbot", "Slack", botLinkPreview, false},
	{"slack-imgproxy", "Slack", botLinkPreview, false},
	{"discordbot", "Discord", botLinkPreview, false},
	{"skypeuripreview", "Microsoft Teams / Skype", botLinkPreview, false},
	{"microsoftpreview", "Microsoft Teams / Outlook", botLinkPreview, false},
	{"viber", "Viber", botLinkPreview, true},
	{"pinterestbot", "Pinterest", botLinkPreview, false},
	{"redditbot", "Reddit", botLinkPreview, false},
	{"snap url preview", "Snapchat", botLinkPreview, false},
	{"kakaotalk-scrap", "KakaoTalk", botLinkPreview, false},
	{"bluesky cardyb", "Bluesky", botLinkPreview, false},
	{"mastodon/", "Mastodon", botLinkPreview, false},
	{"tumblr", "Tumblr", botLinkPreview, true},
	{"embedly", "Embedly", botLinkPreview, false},
	{"iframely", "Iframely", botLinkPreview, false},
	{"google-pagerenderer", "Google Page Renderer", botLinkPreview, false},
	{"vkshare", "VK", botLinkPreview, false},
	{"bitlybot", "Bitly", botLinkPreview, false},
	// SEO tools.
	{"ahrefsbot", "AhrefsBot", botSEOTool, false},
	{"ahrefssiteaudit", "Ahrefs Site Audit", botSEOTool, false},
	{"semrushbot", "SemrushBot", botSEOTool, false},
	{"siteauditbot", "Semrush Site Audit", botSEOTool, false},
	{"mj12bot", "MJ12bot (Majestic)", botSEOTool, false},
	{"dotbot", "DotBot (Moz)", botSEOTool, false},
	{"rogerbot", "Rogerbot (Moz)", botSEOTool, false},
	{"screaming frog", "Screaming Frog", botSEOTool, false},
	{"sitebulb", "Sitebulb", botSEOTool, false},
	{"serpstatbot", "SerpstatBot", botSEOTool, false},
	{"blexbot", "BLEXBot", botSEOTool, false},
	{"dataforseobot", "DataForSeoBot", botSEOTool, false},
	{"barkrowler", "Barkrowler", botSEOTool, false},
	{"seokicks", "SEOkicks", botSEOTool, false},
	{"megaindex", "MegaIndex", botSEOTool, false},
	{"sistrix", "SISTRIX", botSEOTool, false},
	{"oncrawl", "OnCrawl", botSEOTool, false},
	{"contentkingapp", "ContentKing", botSEOTool, false},
	{"botify", "Botify", botSEOTool, false},
	{"awariobot", "AwarioBot", botSEOTool, false},
	{"seznam-zbozi", "Seznam", botSEOTool, false},
	// Uptime and synthetic monitors.
	{"uptimerobot", "UptimeRobot", botMonitor, false},
	{"pingdom", "Pingdom", botMonitor, false},
	{"statuscake", "StatusCake", botMonitor, false},
	{"site24x7", "Site24x7", botMonitor, false},
	{"better uptime", "Better Stack", botMonitor, false},
	{"betterstack", "Better Stack", botMonitor, false},
	{"freshping", "Freshping", botMonitor, false},
	{"hetrixtools", "HetrixTools", botMonitor, false},
	{"newrelicpinger", "New Relic", botMonitor, false},
	{"datadogsynthetics", "Datadog Synthetics", botMonitor, false},
	{"checkly", "Checkly", botMonitor, false},
	{"uptime-kuma", "Uptime Kuma", botMonitor, false},
	{"updown.io", "updown.io", botMonitor, false},
	{"nodeping", "NodePing", botMonitor, false},
	{"gatus", "Gatus", botMonitor, false},
	{"kube-probe", "Kubernetes probe", botMonitor, false},
	{"elb-healthchecker", "AWS ELB health check", botMonitor, false},
	{"googlehc", "Google health check", botMonitor, false},
	{"consul health check", "Consul health check", botMonitor, false},
	{"cloudflare-healthchecks", "Cloudflare health check", botMonitor, false},
	{"cloudflare-alwaysonline", "Cloudflare Always Online", botMonitor, false},
	// Headless browsers and page-speed tools.
	{"headlesschrome", "HeadlessChrome", botHeadless, false},
	{"phantomjs", "PhantomJS", botHeadless, false},
	{"puppeteer", "Puppeteer", botHeadless, false},
	{"playwright", "Playwright", botHeadless, false},
	{"selenium", "Selenium", botHeadless, false},
	{"chrome-lighthouse", "Lighthouse", botHeadless, false},
	{"google page speed", "PageSpeed Insights", botHeadless, false},
	{"gtmetrix", "GTmetrix", botHeadless, false},
	{"ptst/", "WebPageTest", botHeadless, false},
	{"prerender", "Prerender", botHeadless, false},
	// Search engines.
	{"googlebot", "Googlebot", botSearch, false},
	{"google-inspectiontool", "Google-InspectionTool", botSearch, false},
	{"storebot-google", "Storebot-Google", botSearch, false},
	{"googleother", "GoogleOther", botSearch, false},
	{"adsbot-google", "AdsBot-Google", botSearch, false},
	{"mediapartners-google", "Mediapartners-Google", botSearch, false},
	{"apis-google", "APIs-Google", botSearch, false},
	{"feedfetcher-google", "Google Feedfetcher", botSearch, false},
	{"bingbot", "Bingbot", botSearch, false},
	{"bingpreview", "BingPreview", botSearch, false},
	{"adidxbot", "AdIdxBot (Bing)", botSearch, false},
	{"msnbot", "msnbot", botSearch, false},
	{"yandexbot", "YandexBot", botSearch, false},
	{"yandex.com/bots", "Yandex", botSearch, false},
	{"baiduspider", "Baiduspider", botSearch, false},
	{"duckduckbot", "DuckDuckBot", botSearch, false},
	{"slurp", "Yahoo Slurp", botSearch, false},
	{"applebot", "Applebot", botSearch, false},
	{"seznambot", "SeznamBot", botSearch, false},
	{"yeti/", "Naver Yeti", botSearch, false},
	{"sogou", "Sogou", botSearch, false},
	{"petalbot", "PetalBot", botSearch, false},
	{"qwantify", "Qwant", botSearch, false},
	{"qwantbot", "Qwant", botSearch, false},
	{"mojeekbot", "MojeekBot", botSearch, false},
	{"coccocbot", "CocCocBot", botSearch, false},
	{"exabot", "Exabot", botSearch, false},
	{"yisouspider", "YisouSpider", botSearch, false},
	{"360spider", "360Spider", botSearch, false},
	{"daumoa", "Daum", botSearch, false},
	{"bravebot", "Brave Search", botSearch, false},
	{"ecosia", "Ecosia", botSearch, false},
	// Programmatic HTTP clients and libraries.
	{"curl/", "curl", botHTTPClient, false},
	{"wget", "Wget", botHTTPClient, false},
	{"python-requests", "python-requests", botHTTPClient, false},
	{"python-urllib", "Python urllib", botHTTPClient, false},
	{"python-httpx", "HTTPX", botHTTPClient, false},
	{"aiohttp", "aiohttp", botHTTPClient, false},
	{"go-http-client", "Go http client", botHTTPClient, false},
	{"okhttp", "OkHttp", botHTTPClient, false},
	{"apache-httpclient", "Apache HttpClient", botHTTPClient, false},
	{"java/", "Java", botHTTPClient, false},
	{"axios", "axios", botHTTPClient, false},
	{"node-fetch", "node-fetch", botHTTPClient, false},
	{"undici", "undici (Node.js)", botHTTPClient, false},
	{"got (", "got (Node.js)", botHTTPClient, false},
	{"libwww-perl", "libwww-perl", botHTTPClient, false},
	{"guzzlehttp", "Guzzle (PHP)", botHTTPClient, false},
	{"php/", "PHP", botHTTPClient, false},
	{"ruby", "Ruby", botHTTPClient, false},
	{"faraday", "Faraday (Ruby)", botHTTPClient, false},
	{"httpie", "HTTPie", botHTTPClient, false},
	{"postmanruntime", "Postman", botHTTPClient, false},
	{"insomnia", "Insomnia", botHTTPClient, false},
	{"dart:io", "Dart", botHTTPClient, false},
	{"reqwest", "reqwest (Rust)", botHTTPClient, false},
	{"http.rb", "http.rb", botHTTPClient, false},
	{"powershell", "PowerShell", botHTTPClient, false},
	{"winhttp", "WinHTTP", botHTTPClient, false},
	{"cfnetwork", "CFNetwork", botHTTPClient, false},
	{"masscan", "masscan", botProbe, false},
	{"zgrab", "zgrab", botProbe, false},
	{"nmap", "Nmap", botProbe, false},
	{"nuclei", "Nuclei", botProbe, false},
	{"sqlmap", "sqlmap", botProbe, false},
	{"nikto", "Nikto", botProbe, false},
	{"censysinspect", "Censys", botProbe, false},
	{"expanse", "Palo Alto Expanse", botProbe, false},
	{"internet-measurement", "Internet measurement", botProbe, false},
}

// genericBotTokens catch unlisted crawlers (category other).
var genericBotTokens = []string{"bot", "crawler", "crawl", "spider", "scraper", "fetcher", "headless", "preview", "monitor", "archiver", "validator", "checker"}

// genericBotFalsePositives are human UAs that contain a generic token.
var genericBotFalsePositives = []string{"cubot", "ubot", "robotic"}

// probePrefixes are vulnerability-scanner paths (lower-case, normalised).
var probePrefixes = []string{
	"/wp-login", "/wp-admin", "/wp-content", "/wp-includes", "/wp-json", "/xmlrpc.php", "/wordpress",
	"/.env", "/.git", "/.svn", "/.hg", "/.aws", "/.ssh", "/.ds_store", "/.vscode", "/.idea", "/.well-known/security.txt.bak",
	"/phpmyadmin", "/pma", "/myadmin", "/mysql", "/adminer", "/cgi-bin", "/vendor/phpunit", "/boaform",
	"/server-status", "/server-info", "/actuator", "/owa", "/hnap1", "/sftp-config.json", "/config.json",
	"/backup", "/db.sql", "/dump.sql", "/database.sql", "/telescope", "/_ignition", "/solr", "/console",
	"/remote/login", "/autodiscover", "/ecp/", "/manager/html", "/geoserver", "/jenkins", "/druid",
}

// probeSuffixes flag server-side script / backup extensions this CMS never serves.
var probeSuffixes = []string{".php", ".asp", ".aspx", ".jsp", ".cgi", ".bak", ".old", ".sql", ".tar.gz", ".swp", ".ini", ".env", ".yml", ".yaml"}
