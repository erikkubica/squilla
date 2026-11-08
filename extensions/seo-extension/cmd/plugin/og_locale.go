package main

import "strings"

// facebookLocales are the og:locale values Facebook accepts. Its parser
// treats og:locale as an enum and rejects the whole Open Graph object
// (Graph API error 1611016) for anything else, including a bare "en".
//
// Order matters: the first entry for a language is its default when a
// site's language code carries no region ("en" → en_US, "pt" → pt_PT).
var facebookLocales = []string{
	"af_ZA", "ar_AR", "az_AZ", "be_BY", "bg_BG", "bn_IN", "bs_BA", "ca_ES",
	"cs_CZ", "cy_GB", "da_DK", "de_DE", "el_GR",
	"en_US", "en_GB", "en_IN",
	"eo_EO", "es_ES", "es_LA", "et_EE", "eu_ES", "fa_IR", "fi_FI", "fo_FO",
	"fr_FR", "fr_CA",
	"fy_NL", "ga_IE", "gl_ES", "gu_IN", "he_IL", "hi_IN", "hr_HR", "hu_HU",
	"hy_AM", "id_ID", "is_IS", "it_IT", "ja_JP", "ka_GE", "km_KH", "kn_IN",
	"ko_KR", "ku_TR", "la_VA", "lt_LT", "lv_LV", "mk_MK", "ml_IN", "mn_MN",
	"mr_IN", "ms_MY", "my_MM", "nb_NO", "ne_NP", "nl_NL", "nn_NO", "pa_IN",
	"pl_PL", "ps_AF",
	"pt_PT", "pt_BR",
	"ro_RO", "ru_RU", "si_LK", "sk_SK", "sl_SI", "sq_AL", "sr_RS", "sv_SE",
	"sw_KE", "ta_IN", "te_IN", "th_TH", "tl_PH", "tr_TR", "uk_UA", "ur_PK",
	"uz_UZ", "vi_VN",
	"zh_CN", "zh_TW", "zh_HK",
}

var (
	facebookLocaleSet    = map[string]bool{}
	facebookLocaleByLang = map[string]string{}
)

// Language codes that differ from Facebook's language part.
var ogLanguageAliases = map[string]string{
	"no":  "nb",
	"iw":  "he",
	"fil": "tl",
	"in":  "id",
}

// Region spellings that map onto Facebook's own buckets.
var ogLocaleAliases = map[string]string{
	"es_MX": "es_LA", "es_AR": "es_LA", "es_CO": "es_LA", "es_CL": "es_LA",
	"es_PE": "es_LA", "es_419": "es_LA", "en_AU": "en_GB", "en_IE": "en_GB",
	"en_NZ": "en_GB", "zh_SG": "zh_CN", "zh_MO": "zh_HK", "ar_SA": "ar_AR",
	"ar_EG": "ar_AR", "ar_AE": "ar_AR",
}

func init() {
	for _, l := range facebookLocales {
		facebookLocaleSet[l] = true
		lang := l[:strings.Index(l, "_")]
		if _, ok := facebookLocaleByLang[lang]; !ok {
			facebookLocaleByLang[lang] = l
		}
	}
}

// ogLocale maps a site language code ("en", "pt-BR", "zh_tw") to a
// Facebook og:locale value, or "" when there is no valid mapping.
func ogLocale(code string) string {
	code = strings.TrimSpace(strings.ReplaceAll(code, "-", "_"))
	if code == "" {
		return ""
	}
	lang, region, _ := strings.Cut(code, "_")
	lang = strings.ToLower(lang)
	if alias, ok := ogLanguageAliases[lang]; ok {
		lang = alias
	}
	if region != "" {
		// Script subtags: zh_Hant → zh_TW, zh_Hans → zh_CN.
		switch strings.ToLower(region) {
		case "hant":
			region = "TW"
		case "hans":
			region = "CN"
		}
		full := lang + "_" + strings.ToUpper(region)
		if alias, ok := ogLocaleAliases[full]; ok {
			full = alias
		}
		if facebookLocaleSet[full] {
			return full
		}
	}
	return facebookLocaleByLang[lang]
}
