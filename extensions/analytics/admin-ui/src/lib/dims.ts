// Dimension metadata: labels, value display and dashboard → filter mapping.
import type { BreakdownDim, FilterDim } from "../api/types";
import { countryName, flagEmoji, humanize, languageName } from "./format";

export const DIM_LABELS: Record<BreakdownDim, string> = {
  page: "Page",
  entry_page: "Entry page",
  exit_page: "Exit page",
  source: "Source",
  channel: "Channel",
  referrer: "Referrer",
  utm_source: "UTM source",
  utm_medium: "UTM medium",
  utm_campaign: "Campaign",
  utm_content: "UTM content",
  utm_term: "UTM term",
  country: "Country",
  language: "Language",
  device: "Device",
  browser: "Browser",
  os: "Operating system",
  page_type: "Page type",
  not_found: "Not found path",
  download: "Download",
  outbound: "Outbound link",
  goal: "Goal",
  viewport: "Viewport",
  color_scheme: "Color scheme",
};

/** Which filter (if any) clicking a breakdown row applies. */
export function filterDimFor(dim: BreakdownDim): FilterDim | null {
  switch (dim) {
    case "exit_page":
    case "page":
      return "page";
    case "entry_page":
    case "source":
    case "channel":
    case "referrer":
    case "utm_source":
    case "utm_medium":
    case "utm_campaign":
    case "country":
    case "language":
    case "device":
    case "browser":
    case "os":
    case "page_type":
    case "goal":
      return dim;
    default:
      return null;
  }
}

const CHANNELS: Record<string, string> = {
  direct: "Direct",
  organic_search: "Organic search",
  paid_search: "Paid search",
  organic_social: "Organic social",
  paid_social: "Paid social",
  ai: "AI assistants",
  email: "Email",
  referral: "Referral",
  campaign: "Campaign",
};

/** Human label for a raw dimension value (falls back to the API label). */
export function valueLabel(dim: BreakdownDim | FilterDim, value: string, apiLabel?: string): string {
  if (!value) return apiLabel || "(none)";
  switch (dim) {
    case "country":
      return apiLabel && apiLabel !== value ? apiLabel : countryName(value);
    case "language":
      return apiLabel && apiLabel !== value ? apiLabel : languageName(value);
    case "channel":
      return CHANNELS[value] ?? apiLabel ?? humanize(value);
    case "device":
    case "page_type":
    case "color_scheme":
      return apiLabel && apiLabel !== value ? apiLabel : humanize(value);
    default:
      return apiLabel || value;
  }
}

export function valuePrefix(dim: BreakdownDim | FilterDim, value: string): string {
  if (dim === "country") return flagEmoji(value);
  return "";
}

/** Whether the value is a site path we can link to on the public site. */
export function isPathDim(dim: BreakdownDim): boolean {
  return dim === "page" || dim === "entry_page" || dim === "exit_page" || dim === "not_found" || dim === "download";
}
