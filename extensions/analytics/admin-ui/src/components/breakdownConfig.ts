import type { BreakdownDim, BreakdownRow } from "../api/types";

export interface BreakdownTab {
  dim: BreakdownDim;
  label: string;
  /** One line under the card title explaining this list. */
  hint?: string;
  /** Header of the first column (defaults to the dimension's label). */
  column?: string;
  /** Message when this list is empty (overrides the card's). */
  empty?: string;
}

export interface BreakdownCardDef {
  id: string;
  title: string;
  description?: string;
  tabs: BreakdownTab[];
}

const NEEDS_IN_PAGE = "Nothing yet. Screen sizes and light or dark mode are measured only when in-page measurement is on (Settings).";

/** Every list card, named by what it answers. Pages pick the ones they need. */
export const CARDS = {
  topPages: {
    id: "top-pages",
    title: "Top pages",
    tabs: [{ dim: "page", label: "Most viewed", column: "Page", hint: "The pages people opened most" }],
  },
  pages: {
    id: "pages",
    title: "Pages",
    tabs: [
      { dim: "page", label: "Most viewed", column: "Page", hint: "Every page people opened" },
      { dim: "entry_page", label: "Where visits start", column: "Landing page", hint: "The first page of each visit, often the one people found on Google or in a shared link" },
      { dim: "exit_page", label: "Where visits end", column: "Last page", hint: "The last page people saw before they left" },
      { dim: "page_type", label: "Page types", column: "Page type", hint: "Pages grouped by kind, such as blog posts or experiences" },
    ],
  },
  sources: {
    id: "sources",
    title: "How people find you",
    tabs: [
      { dim: "channel", label: "Channels", column: "Channel", hint: "Grouped by kind: search engines, social media, AI assistants…" },
      { dim: "source", label: "Websites & apps", column: "Website or app", hint: "The site or app each visitor came from" },
      { dim: "referrer", label: "Exact links", column: "Referring page", hint: "The exact page that linked to you" },
    ],
  },
  campaigns: {
    id: "campaigns",
    title: "Campaigns",
    description: "Visits from links you tagged with utm_ parameters",
    tabs: [
      { dim: "utm_campaign", label: "Campaign", column: "Campaign" },
      { dim: "utm_source", label: "Source", column: "Campaign source" },
      { dim: "utm_medium", label: "Medium", column: "Campaign medium" },
      { dim: "utm_content", label: "Content", column: "Campaign content" },
    ],
  },
  locations: {
    id: "locations",
    title: "Where visitors are",
    tabs: [
      { dim: "country", label: "Countries", column: "Country", hint: "Based on the visitor’s network; the address itself is never stored" },
      { dim: "language", label: "Languages", column: "Language", hint: "The language their browser asks for" },
    ],
  },
  devices: {
    id: "devices",
    title: "What they use",
    tabs: [
      { dim: "device", label: "Device", column: "Device", hint: "Phone, tablet or computer" },
      { dim: "browser", label: "Browser", column: "Browser" },
      { dim: "os", label: "System", column: "Operating system" },
      { dim: "viewport", label: "Screen size", column: "Screen size", hint: "Only from visits measured with in-page measurement", empty: NEEDS_IN_PAGE },
      { dim: "color_scheme", label: "Light or dark", column: "Mode", hint: "Only from visits measured with in-page measurement", empty: NEEDS_IN_PAGE },
    ],
  },
  missing: {
    id: "missing",
    title: "Broken links",
    tabs: [{ dim: "not_found", label: "Missing pages", column: "Address people tried", hint: "Addresses that showed “page not found”. Fix the link that sent people there, or add a redirect." }],
  },
  files: {
    id: "files",
    title: "Downloads & links out",
    tabs: [
      { dim: "download", label: "Files", column: "File", hint: "Files people downloaded, such as PDFs" },
      { dim: "outbound", label: "Other sites", column: "Destination", hint: "Links to other websites people followed" },
    ],
  },
} satisfies Record<string, BreakdownCardDef>;

/** The report each list belongs to (for "back" links from the full table). */
export function homeOf(dim: BreakdownDim): { key: "pages" | "visitors" | "goals"; path: string; label: string } {
  switch (dim) {
    case "page":
    case "entry_page":
    case "exit_page":
    case "page_type":
    case "not_found":
    case "download":
    case "outbound":
      return { key: "pages", path: "/pages", label: "Pages" };
    case "goal":
      return { key: "goals", path: "/goals", label: "Goals" };
    default:
      return { key: "visitors", path: "/visitors", label: "Visitors" };
  }
}

/** Title of the full table for a dimension. */
export const FULL_TITLES: Partial<Record<BreakdownDim, string>> = {
  page: "All pages",
  entry_page: "Where visits start",
  exit_page: "Where visits end",
  page_type: "Page types",
  channel: "Channels",
  source: "Websites & apps",
  referrer: "Referring pages",
  country: "Countries",
  language: "Languages",
  device: "Devices",
  browser: "Browsers",
  os: "Operating systems",
  not_found: "Broken links",
  download: "Downloads",
  outbound: "Links to other sites",
  goal: "Goals",
  viewport: "Screen sizes",
  color_scheme: "Light or dark mode",
};

export type ValueKey = "visitors" | "pageviews" | "visits" | "conversions";

export interface ValueColumn {
  key: ValueKey;
  label: string;
}

/**
 * Columns per dimension. For event-like dimensions (downloads, outbound
 * clicks, 404s) the `pageviews` field carries the hit count.
 */
export function columnsFor(dim: BreakdownDim, full = false): ValueColumn[] {
  switch (dim) {
    case "goal":
      return full
        ? [{ key: "conversions", label: "Times reached" }, { key: "visitors", label: "Visitors" }]
        : [{ key: "conversions", label: "Times reached" }];
    case "outbound":
      return [{ key: "pageviews", label: "Clicks" }, ...(full ? [{ key: "visitors" as const, label: "Visitors" }] : [])];
    case "download":
      return [{ key: "pageviews", label: "Downloads" }, ...(full ? [{ key: "visitors" as const, label: "Visitors" }] : [])];
    case "not_found":
      return [{ key: "pageviews", label: "Times" }, ...(full ? [{ key: "visitors" as const, label: "Visitors" }] : [])];
    case "page":
    case "exit_page":
    case "page_type":
      return full
        ? [
            { key: "visitors", label: "Visitors" },
            { key: "pageviews", label: "Page views" },
            { key: "visits", label: "Visits" },
            { key: "conversions", label: "Conversions" },
          ]
        : [{ key: "visitors", label: "Visitors" }, { key: "pageviews", label: "Views" }];
    default:
      return full
        ? [
            { key: "visitors", label: "Visitors" },
            { key: "visits", label: "Visits" },
            { key: "pageviews", label: "Page views" },
            { key: "conversions", label: "Conversions" },
          ]
        : [{ key: "visitors", label: "Visitors" }];
  }
}

export function defaultSort(dim: BreakdownDim): ValueKey {
  return columnsFor(dim)[0].key;
}

export function rowValue(row: BreakdownRow, key: ValueKey): number {
  return Number(row[key] ?? 0);
}
