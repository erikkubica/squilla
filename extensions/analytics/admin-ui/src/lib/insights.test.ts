import { describe, expect, it } from "vitest";
import type { BreakdownRow, SummaryResponse } from "../api/types";
import { buildInsights, buildSummary, type InsightInput, type Part } from "./insights";
import { comparePhrase, rangePhrase } from "./dates";

const metrics = (visitors: number, pageviews: number, conversions = 0) => ({
  visitors, pageviews, visits: visitors, pages_per_visit: 1, single_page_rate: 0.5, median_visit_seconds: null, conversions, conversion_rate: 0,
});
const row = (value: string, visitors: number, extra: Partial<BreakdownRow> = {}): BreakdownRow => ({
  value, label: value, visitors, pageviews: visitors, visits: visitors, conversions: 0, share: 0, ...extra,
});
const text = (parts: Part[] | null) => (parts ?? []).map((p) => (typeof p === "string" ? p : p.b)).join("");

function input(over: Partial<InsightInput> = {}): InsightInput {
  const summary: SummaryResponse = {
    range: { from: "2026-10-08", to: "2026-11-06", tz: "UTC" },
    current: metrics(120, 300, 6),
    previous: metrics(100, 250, 2),
    sparklines: { visitors: [], pageviews: [], visits: [], conversions: [] },
  };
  return {
    rangePhrase: "in the last 30 days",
    prevPhrase: "the 30 days before",
    summary,
    channels: [row("organic_search", 60, { share: 0.5 }), row("direct", 30, { share: 0.25 })],
    pages: [row("/", 40, { pageviews: 80 }), row("/tours", 20, { pageviews: 90 })],
    devices: [row("mobile", 70), row("desktop", 30)],
    notFound: [],
    notFoundTotal: 0,
    goals: [],
    goalRows: [],
    bots: null,
    behaviour: null,
    links: { visitors: "/v", pages: "/p", page: (p) => `/page?path=${p}`, goals: "/g", newGoal: "/g?new=1", bots: "/b", engagement: "/e" },
    ...over,
  };
}

describe("insights", () => {
  it("sums the period up in one readable paragraph", () => {
    const s = text(buildSummary(input()));
    expect(s).toBe("120 people visited your site in the last 30 days, 20% more than the 30 days before. They viewed 300 pages and reached your goals 6 times. Most found you through search engines like Google (50%).");
    const d = text(buildSummary({ ...input(), channels: [row("direct", 40, { share: 0.44 }), row("organic_search", 30, { share: 0.3 })] }));
    expect(d).toContain("The biggest group came straight to your site (44%)");
    expect(buildSummary(input({ summary: null }))).toBeNull();
  });
  it("orders findings by usefulness and respects skip", () => {
    const ids = buildInsights(input({ notFound: [row("/old", 3)], notFoundTotal: 1 }), 10).map((x) => x.id);
    expect(ids).toEqual(["trend", "broken", "source", "page", "goal-setup", "phone"]);
    expect(buildInsights(input(), 10, ["trend", "source"]).map((x) => x.id)).toEqual(["page", "goal-setup", "phone"]);
  });
  it("picks the most viewed page, not the one with most visitors", () => {
    const page = buildInsights(input(), 10).find((x) => x.id === "page");
    expect(text(page!.parts)).toContain("/tours");
    expect(page!.link!.to).toBe("/page?path=/tours");
  });
  it("warns when few visits are engaged", () => {
    const b = { visits: 50, engaged: 10, single_page_known: 0, median_exit_dwell_s: null, avg_reach: null, sections_seen: 0, clicks: 0, signals: 0 };
    const e = buildInsights(input({ behaviour: b }), 10).find((x) => x.id === "engaged");
    expect(e!.tone).toBe("warn");
    expect(text(e!.parts)).toContain("20%");
  });
  it("describes ranges in words", () => {
    expect(rangePhrase("custom", { from: "2026-10-03", to: "2026-10-09" })).toBe("between Oct 3 and Oct 9, 2026");
    expect(comparePhrase({ from: "2026-11-06", to: "2026-11-06" }, "previous")).toBe("the day before");
    expect(comparePhrase({ from: "2026-10-08", to: "2026-11-06" }, "year")).toBe("the same days last year");
  });
});
