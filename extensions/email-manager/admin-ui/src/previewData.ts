import { useEffect, useState } from "react";
import { getSiteSettings } from "@squilla/api";

// Site values pulled from the real site settings. Used to fill `.site` in
// previews so the layout header doesn't render empty when the test data
// omits it.
export interface PreviewSite {
  name?: string;
  url?: string;
}

// useSiteSettingsForPreview loads site_name / site_url once. Failures are
// silent: previews still render with whatever the test data provides.
export function useSiteSettingsForPreview(): PreviewSite {
  const [site, setSite] = useState<PreviewSite>({});
  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => getSiteSettings())
      .then((settings: Record<string, string> | undefined) => {
        if (cancelled || !settings) return;
        setSite({ name: settings.site_name || undefined, url: settings.site_url || undefined });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return site;
}

function pick(...values: unknown[]): unknown {
  return values.find((v) => v !== undefined && v !== null && v !== "");
}

// withSiteContext mirrors the runtime `.site` shape built by the dispatcher
// (loadSiteContext): canonical `name` / `url` plus the `site_name` /
// `site_url` aliases. Typed test data wins over settings; settings win over
// the optional fallback.
export function withSiteContext(
  data: Record<string, any>,
  settings: PreviewSite,
  fallback: PreviewSite = {},
): Record<string, any> {
  const typed =
    data.site && typeof data.site === "object" && !Array.isArray(data.site)
      ? (data.site as Record<string, unknown>)
      : {};
  const name = pick(typed.name, typed.site_name, settings.name, fallback.name);
  const url = pick(typed.url, typed.site_url, settings.url, fallback.url);
  const site: Record<string, unknown> = { ...typed };
  if (name !== undefined) {
    site.name = typed.name ?? name;
    site.site_name = typed.site_name ?? name;
  }
  if (url !== undefined) {
    site.url = typed.url ?? url;
    site.site_url = typed.site_url ?? url;
  }
  return { ...data, site };
}
