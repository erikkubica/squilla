package cms

import (
	"log"
	"regexp"
	"strings"
	"sync"
)

var cookieNameRe = regexp.MustCompile(`^[a-z0-9_]{3,48}$`)

var (
	reservedMu      sync.RWMutex
	reservedCookies = map[string]bool{}
)

// ReserveCookieNames marks cookies (the kernel session cookie) that no
// extension may ever read, whatever its manifest declares.
func ReserveCookieNames(names ...string) {
	reservedMu.Lock()
	defer reservedMu.Unlock()
	for _, n := range names {
		reservedCookies[strings.ToLower(n)] = true
	}
}

// ownedCookieSet returns the manifest's cookie names that carry the
// extension's own prefix (slug with '-' -> '_', plus '_') and are not
// reserved. Like ownedFunctionSet, the prefix stops an extension from
// claiming the session cookie or another extension's cookies.
func ownedCookieSet(slug, field string, names []string) []string {
	prefix := strings.ReplaceAll(slug, "-", "_") + "_"
	reservedMu.RLock()
	defer reservedMu.RUnlock()
	var out []string
	for _, n := range names {
		switch {
		case !strings.HasPrefix(n, prefix) || len(n) == len(prefix) || !cookieNameRe.MatchString(n):
			log.Printf("[plugins] %s: ignoring %s entry %q (must be lower-case and start with %q)", slug, field, n, prefix)
		case reservedCookies[n]:
			log.Printf("[plugins] %s: ignoring %s entry %q (reserved cookie)", slug, field, n)
		default:
			out = append(out, n)
		}
	}
	return out
}
