import { useEffect, useState } from "react";

export interface Branding {
  siteTitle: string;
  faviconUrl: string | null;
}

const FALLBACK: Branding = { siteTitle: "Squilla", faviconUrl: null };

// useBranding fetches the public soft-branding payload from /admin/branding
// (UN-authenticated by design — see internal/cms/branding_handler.go for
// the security rationale). Used by the login page and the sidebar header so
// both surfaces show the operator's site title and active-theme favicon
// instead of the hardcoded "Squilla" + "S" tile.
export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetch("/admin/branding", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const title = typeof data.site_title === "string" ? data.site_title.trim() : "";
        const fav = typeof data.favicon_url === "string" && data.favicon_url ? data.favicon_url : null;
        setBranding({
          siteTitle: title || FALLBACK.siteTitle,
          faviconUrl: fav,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return branding;
}
