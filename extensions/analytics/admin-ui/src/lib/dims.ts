// Dimension metadata: labels, value display and dashboard → filter mapping.
import type { BreakdownDim, FilterDim } from "../api/types";
import { channelInfo } from "./channels";
import { countryName, flagEmoji, humanize, languageName } from "./format";

export const DIM_LABELS: Record<BreakdownDim, string> = {
  page: "Page",
  entry_page: "Landing page",
  exit_page: "Last page",
  source: "Website or app",
  channel: "Channel",
  referrer: "Referring link",
  utm_source: "Campaign source",
  utm_medium: "Campaign medium",
  utm_campaign: "Campaign",
  utm_content: "Campaign content",
  utm_term: "Campaign term",
  country: "Country",
  language: "Language",
  device: "Device",
  browser: "Browser",
  os: "Operating system",
  page_type: "Page type",
  not_found: "Missing page",
  download: "File",
  outbound: "Link to another site",
  goal: "Goal",
  viewport: "Screen size",
  color_scheme: "Light or dark mode",
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

/** What an empty value means for each dimension. */
const EMPTY_LABELS: Partial<Record<BreakdownDim | FilterDim, string>> = {
  country: "Unknown country",
  language: "Unknown language",
  source: "No source (direct)",
  referrer: "No referring link",
  utm_source: "Not tagged",
  utm_medium: "Not tagged",
  utm_campaign: "Not tagged",
  utm_content: "Not tagged",
  utm_term: "Not tagged",
  browser: "Unknown browser",
  os: "Unknown system",
  device: "Unknown device",
  page_type: "Other pages",
  viewport: "Unknown size",
  color_scheme: "Unknown",
};

const VIEWPORTS: Record<string, string> = { s: "Small (phone)", m: "Medium (tablet)", l: "Large (laptop, desktop)" };

/** Human label for a raw dimension value (falls back to the API label). */
export function valueLabel(dim: BreakdownDim | FilterDim, value: string, apiLabel?: string): string {
  if (!value) return EMPTY_LABELS[dim] || (apiLabel && apiLabel !== "(none)" ? apiLabel : "Not set");
  switch (dim) {
    case "country":
      return apiLabel && apiLabel !== value ? apiLabel : countryName(value);
    case "language":
      return apiLabel && apiLabel !== value ? apiLabel : languageName(value);
    case "channel":
      return channelInfo(value)?.label ?? apiLabel ?? humanize(value);
    case "viewport":
      return VIEWPORTS[value] ?? apiLabel ?? value;
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
