import type { BreakdownDim, BreakdownRow } from "../api/types";

export interface BreakdownTab {
  dim: BreakdownDim;
  label: string;
}

export interface BreakdownCardDef {
  id: string;
  title: string;
  tabs: BreakdownTab[];
}

export const BREAKDOWN_CARDS: BreakdownCardDef[] = [
  {
    id: "pages",
    title: "Pages",
    tabs: [
      { dim: "page", label: "Top" },
      { dim: "entry_page", label: "Entry" },
      { dim: "exit_page", label: "Exit" },
      { dim: "page_type", label: "Page types" },
    ],
  },
  {
    id: "sources",
    title: "Sources",
    tabs: [
      { dim: "channel", label: "Channels" },
      { dim: "source", label: "Sources" },
      { dim: "referrer", label: "Referrers" },
      { dim: "utm_campaign", label: "Campaigns" },
    ],
  },
  {
    id: "locations",
    title: "Locations",
    tabs: [
      { dim: "country", label: "Countries" },
      { dim: "language", label: "Languages" },
    ],
  },
  {
    id: "devices",
    title: "Devices",
    tabs: [
      { dim: "device", label: "Device" },
      { dim: "browser", label: "Browser" },
      { dim: "os", label: "OS" },
    ],
  },
  {
    id: "conversions",
    title: "Conversions",
    tabs: [
      { dim: "goal", label: "Goals" },
      { dim: "outbound", label: "Outbound links" },
      { dim: "download", label: "Downloads" },
    ],
  },
  {
    id: "not_found",
    title: "Not found",
    tabs: [{ dim: "not_found", label: "404 pages" }],
  },
];

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
        ? [{ key: "conversions", label: "Conversions" }, { key: "visitors", label: "Visitors" }]
        : [{ key: "conversions", label: "Conversions" }];
    case "outbound":
      return [{ key: "pageviews", label: "Clicks" }, ...(full ? [{ key: "visitors" as const, label: "Visitors" }] : [])];
    case "download":
      return [{ key: "pageviews", label: "Downloads" }, ...(full ? [{ key: "visitors" as const, label: "Visitors" }] : [])];
    case "not_found":
      return [{ key: "pageviews", label: "Hits" }, ...(full ? [{ key: "visitors" as const, label: "Visitors" }] : [])];
    case "page":
    case "exit_page":
    case "page_type":
      return full
        ? [
            { key: "visitors", label: "Visitors" },
            { key: "pageviews", label: "Pageviews" },
            { key: "visits", label: "Visits" },
            { key: "conversions", label: "Conversions" },
          ]
        : [{ key: "visitors", label: "Visitors" }, { key: "pageviews", label: "Views" }];
    default:
      return full
        ? [
            { key: "visitors", label: "Visitors" },
            { key: "visits", label: "Visits" },
            { key: "pageviews", label: "Pageviews" },
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
