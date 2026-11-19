import { describe, expect, it } from "vitest";
import type { ClicksResponse } from "../api/types";
import { clickFindings, groupLinks, prettyDest } from "./clicks";

const base: ClicksResponse = {
  totals: { views: 40, clicking_views: 10, sections_seen: 120, clicks: 20, nav_clicks: 12, contact_clicks: 3, outbound_clicks: 1 },
  links: [
    { path: "/", block_key: "n", section: "", section_pos: 999, nav: true, text: "About", dest: "/about", class: "i", clicks: 8, views: 7, page_views: 30 },
    { path: "/tours", block_key: "n", section: "", section_pos: 999, nav: true, text: "About", dest: "/about", class: "i", clicks: 4, views: 4, page_views: 10 },
    { path: "/", block_key: "bv-hero.0", section: "Find your tour", section_pos: 0, nav: false, text: "", dest: "/tours", class: "i", clicks: 5, views: 3, page_views: 30 },
  ],
  sections: [
    { path: "/", block_key: "bv-hero.0", label: "Find your tour", pos: 0, nav: false, seen: 30, clicked: 3, clicks: 5, links: 2 },
    { path: "/", block_key: "bv-faq.0", label: "", pos: 1, nav: false, seen: 20, clicked: 6, clicks: 6, links: 1 },
  ],
  ignored: [{ path: "/", block_key: "bv-faq.0", section: "", text: "See prices", dest: "/prices", pos: 4, seen: 20 }],
  pages: [],
  destinations: [{ dest: "wa.me/123", class: "c", clicks: 3, views: 3, top_page: "/" }],
};

const text = (parts: (string | { b: string })[]) => parts.map((p) => (typeof p === "string" ? p : p.b)).join("");

describe("clickFindings", () => {
  const f = clickFindings(base, (p) => `/page?path=${p}`);
  const byId = Object.fromEntries(f.map((x) => [x.id, text(x.parts)]));
  it("names links by text and section heading", () => {
    expect(byId.top).toBe("Most clicked link in your content: “/tours” in Find your tour on / — 5 clicks from 3 views.");
  });
  it("uses per-view rates", () => {
    expect(byId.rate).toContain("25%");
    expect(byId.best).toContain("FAQ on /");
    expect(byId.best).toContain("30%");
  });
  it("flags navigation-heavy clicking, contact clicks and ignored links", () => {
    expect(byId.nav).toMatch(/^60% of clicks are on the menu/);
    expect(byId.nav).toContain("“About”");
    expect(byId.contact).toBe("3 clicks to get in touch, most to wa.me/123 (3).");
    expect(byId.ignored).toContain("“See prices” in FAQ on /");
  });
  it("stays quiet without data", () => {
    const empty = { ...base, totals: { ...base.totals, views: 0, clicks: 0, nav_clicks: 0, contact_clicks: 0 }, links: [], sections: [], ignored: [], destinations: [] };
    expect(clickFindings(empty, () => "")).toEqual([]);
  });
});

describe("groupLinks", () => {
  it("adds the same link up over pages", () => {
    const g = groupLinks(base.links, true);
    expect(g[0]).toMatchObject({ text: "About", clicks: 12, views: 11, pages: 2, path: undefined });
    expect(g[1]).toMatchObject({ text: "/tours", pages: 1, path: "/" });
  });
  it("keeps one row per page otherwise", () => {
    expect(groupLinks(base.links, false)).toHaveLength(3);
  });
});

describe("prettyDest", () => {
  it("reads well", () => {
    expect(prettyDest("/")).toBe("Home page");
    expect(prettyDest("mailto:a@b.c")).toBe("a@b.c");
  });
});
