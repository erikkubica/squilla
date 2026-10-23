// Bot categories → display groups with fixed colors (color follows the
// entity, never its rank). 11 categories fold into 8 groups so the
// categorical palette is never cycled.
import type { BotsResponse } from "../api/types";

export interface BotGroup {
  key: string;
  label: string;
  color: string;
  description: string;
  categories: string[];
}

export const BOT_GROUPS: BotGroup[] = [
  { key: "search", label: "Search engines", color: "var(--an-c1)", categories: ["search"], description: "Classic search crawlers such as Googlebot and Bingbot." },
  { key: "ai_crawler", label: "AI training crawlers", color: "var(--an-c2)", categories: ["ai_crawler"], description: "Bulk crawlers collecting training data (GPTBot, ClaudeBot, CCBot…)." },
  { key: "ai_search", label: "AI search indexers", color: "var(--an-c3)", categories: ["ai_search"], description: "Indexers that power AI answer engines (OAI-SearchBot, PerplexityBot…)." },
  { key: "ai_assistant", label: "AI assistants", color: "var(--an-c4)", categories: ["ai_assistant"], description: "Fetched live because a person asked an assistant about your page (ChatGPT-User, Claude-User…)." },
  { key: "link_preview", label: "Link previews", color: "var(--an-c5)", categories: ["link_preview"], description: "Apps building a preview card when someone shares your link (WhatsApp, Facebook, Slack…)." },
  { key: "seo_tool", label: "SEO tools", color: "var(--an-c6)", categories: ["seo_tool"], description: "Commercial SEO crawlers (Ahrefs, Semrush…)." },
  { key: "monitor", label: "Monitors", color: "var(--an-c7)", categories: ["monitor"], description: "Uptime and performance monitors." },
  { key: "other", label: "Other & probes", color: "var(--an-c8)", categories: ["http_client", "headless", "probe", "other"], description: "Scripts, headless browsers, vulnerability probes and unclassified automation." },
];

const CATEGORY_LABELS: Record<string, string> = {
  search: "Search engine",
  ai_crawler: "AI training crawler",
  ai_search: "AI search indexer",
  ai_assistant: "AI assistant",
  link_preview: "Link preview",
  seo_tool: "SEO tool",
  monitor: "Monitor",
  http_client: "HTTP client",
  headless: "Headless browser",
  probe: "Vulnerability probe",
  other: "Other",
};

export function categoryLabel(c: string): string {
  return CATEGORY_LABELS[c] ?? c;
}

export function groupOf(category: string): BotGroup {
  return BOT_GROUPS.find((g) => g.categories.includes(category)) ?? BOT_GROUPS[BOT_GROUPS.length - 1];
}

export function groupTotals(totals: BotsResponse["totals"]): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(BOT_GROUPS.map((g) => [g.key, 0]));
  for (const t of totals) out[groupOf(t.category).key] += Number(t.hits) || 0;
  return out;
}

/** Pivot `{t, category, hits}` rows into ordered buckets keyed by group. */
export function pivotTimeseries(rows: BotsResponse["timeseries"]): { t: string; values: Record<string, number> }[] {
  const map = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const g = groupOf(r.category).key;
    const bucket = map.get(r.t) ?? {};
    bucket[g] = (bucket[g] ?? 0) + (Number(r.hits) || 0);
    map.set(r.t, bucket);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([t, values]) => ({ t, values }));
}
