import { describe, expect, it } from "vitest";
import type { RecInsights } from "../api/types";
import { fmtMetric, frustrationFindings, rate } from "./vitals";

const base: RecInsights = {
  totals: { recordings: 100, rage: 0, dead: 0, errors: 0, quick_back: 0, excessive_scroll: 0, slow: 0 },
  elements: [],
  errors: [],
  vitals: [],
  site_vitals: { lcp: 1800, inp: 120, cls: 20, ttfb: 300, by_device: {} },
};

describe("vitals", () => {
  it("rates against Google's thresholds", () => {
    expect(rate("lcp", 2500)).toBe("good");
    expect(rate("lcp", 3000)).toBe("ok");
    expect(rate("lcp", 4001)).toBe("poor");
    expect(rate("cls", 260)).toBe("poor");
    expect(rate("inp", null)).toBeNull();
  });
  it("formats", () => {
    expect(fmtMetric("lcp", 3456)).toBe("3.5 s");
    expect(fmtMetric("inp", 180)).toBe("180 ms");
    expect(fmtMetric("cls", 115)).toBe("0.12");
    expect(fmtMetric("ttfb", null)).toBe("—");
  });
  it("is calm when nothing is wrong", () => {
    const f = frustrationFindings(base, () => "");
    expect(f.map((x) => x.id)).toEqual(["calm"]);
  });
  it("puts errors first and names the culprit", () => {
    const f = frustrationFindings(
      {
        ...base,
        totals: { ...base.totals, errors: 12, rage: 3, dead: 20 },
        elements: [
          { kind: "dead", path: "/", selector: "body>main:nth-of-type(1)>img:nth-of-type(1)", n: 9 },
          { kind: "rage", path: "/pricing", selector: "#buy", n: 4 },
        ],
        errors: [{ message: "x is not defined", file: "app.js", n: 15, pages: 1, top_page: "/pricing" }],
        site_vitals: { lcp: 5200, inp: 120, cls: 20, ttfb: 300, by_device: { mobile: 6100 } },
      },
      (s) => `/r?signal=${s}`,
    );
    expect(f.map((x) => x.id)).toEqual(["errors", "rage", "dead", "lcp"]);
    expect(JSON.stringify(f[0].parts)).toContain("x is not defined");
    expect(JSON.stringify(f[2].parts)).toContain("main › img");
    expect(JSON.stringify(f[3].parts)).toContain("6.1 s");
    expect(f[1].link?.to).toBe("/r?signal=rage");
  });
});
