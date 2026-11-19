// Plain-language findings and groupings for "What gets clicked". Pure
// functions so the wording rules are testable.
import type { ClickLink, ClicksResponse } from "../api/types";
import { blockName } from "./behaviour";
import { formatInt } from "./format";
import type { Insight, Part } from "./insights";

/** Smallest number of views before a rate is worth a sentence. */
export const MIN_SEEN = 10;

const share = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "0%");

/** What a link is called: its text, else where it goes. */
export function linkText(l: { text: string; dest: string }): string {
  return l.text || prettyDest(l.dest);
}

/** "wa.me/8490…" stays, "mailto:a@b.c" → "a@b.c", "/" → "Home page". */
export function prettyDest(dest: string): string {
  if (!dest || dest === "/") return dest === "/" ? "Home page" : "(unknown)";
  return dest.replace(/^(mailto|tel|sms):/, "");
}

export const DEST_KIND: Record<string, string> = { i: "", x: "Other site", c: "Contact" };

/** "“Book a call” in Hero on /tours" as text parts. */
function where(l: { text: string; dest: string; section: string; block_key: string; path: string }): Part[] {
  return [{ b: `“${linkText(l)}”` }, ` in ${blockName(l.block_key, l.section)} on `, { b: l.path }];
}

export interface GroupedLink {
  key: string;
  text: string;
  dest: string;
  class: string;
  nav: boolean;
  clicks: number;
  views: number;
  /** Set when one page; otherwise the number of pages. */
  path?: string;
  block_key?: string;
  section?: string;
  pages: number;
}

/** One row per link per page, or the same link added up over all pages. */
export function groupLinks(links: ClickLink[], together: boolean): GroupedLink[] {
  if (!together) {
    return links.map((l) => ({ key: `${l.path}|${l.block_key}|${l.dest}`, text: linkText(l), dest: l.dest, class: l.class, nav: l.nav, clicks: l.clicks, views: l.views, path: l.path, block_key: l.block_key, section: l.section, pages: 1 }));
  }
  const m = new Map<string, GroupedLink & { paths: Set<string> }>();
  for (const l of links) {
    const text = linkText(l);
    const key = `${l.nav ? "n" : "c"}|${text}|${l.dest}`;
    const e = m.get(key) ?? { key, text, dest: l.dest, class: l.class, nav: l.nav, clicks: 0, views: 0, pages: 0, paths: new Set<string>() };
    e.clicks += l.clicks;
    e.views += l.views;
    e.paths.add(l.path);
    e.pages = e.paths.size;
    if (e.pages === 1) Object.assign(e, { path: l.path, block_key: l.block_key, section: l.section });
    else Object.assign(e, { path: undefined, block_key: undefined, section: undefined });
    m.set(key, e);
  }
  return [...m.values()].sort((a, b) => b.clicks - a.clicks || b.views - a.views);
}

/** The few things worth knowing, most useful first. */
export function clickFindings(d: ClicksResponse, pageLink: (path: string) => string): Insight[] {
  const out: Insight[] = [];
  const t = d.totals;
  if (t.views > 0) {
    out.push({
      id: "rate",
      tone: "info",
      icon: "engaged",
      parts: [{ b: share(t.clicking_views, t.views) }, ` of measured page views led to a click (${formatInt(t.clicking_views)} of ${formatInt(t.views)}).`],
    });
  }
  const content = d.links.filter((l) => !l.nav);
  const top = content[0];
  if (top) {
    out.push({
      id: "top",
      tone: "good",
      icon: "page",
      parts: ["Most clicked link in your content: ", ...where(top), ` — ${formatInt(top.clicks)} ${top.clicks === 1 ? "click" : "clicks"} from ${formatInt(top.views)} ${top.views === 1 ? "view" : "views"}.`],
      link: { to: pageLink(top.path), label: "Open page report" },
    });
  }
  if (t.clicks >= 10 && t.nav_clicks / t.clicks >= 0.5) {
    const navTop = d.links.find((l) => l.nav);
    out.push({
      id: "nav",
      tone: "warn",
      icon: "source",
      parts: [
        { b: share(t.nav_clicks, t.clicks) },
        " of clicks are on the menu, header or footer, not on links in your page content",
        ...(navTop ? [" (top: ", { b: `“${linkText(navTop)}”` } as Part, ")"] : []),
        ". People look for their own way around: make the next step on each page easier to find.",
      ],
    });
  }
  if (t.contact_clicks > 0) {
    const dests = d.destinations.filter((x) => x.class === "c");
    out.push({
      id: "contact",
      tone: "good",
      icon: "phone",
      parts: [
        { b: formatInt(t.contact_clicks) },
        ` ${t.contact_clicks === 1 ? "click" : "clicks"} to get in touch`,
        ...(dests[0] ? [", most to ", { b: prettyDest(dests[0].dest) } as Part, ` (${formatInt(dests[0].clicks)})`] : []),
        ".",
      ],
    });
  }
  const best = d.sections
    .filter((s) => !s.nav && s.seen >= MIN_SEEN && s.clicked > 0)
    .sort((a, b) => b.clicked / b.seen - a.clicked / a.seen)[0];
  if (best) {
    out.push({
      id: "best",
      tone: "good",
      icon: "up",
      parts: ["Strongest section: ", { b: blockName(best.block_key, best.label) }, " on ", { b: best.path }, ` — ${share(best.clicked, best.seen)} of the people who see it click something.`],
      link: { to: pageLink(best.path), label: "Open page report" },
    });
  }
  const ig = d.ignored[0];
  if (ig) {
    out.push({
      id: "ignored",
      tone: "warn",
      icon: "down",
      parts: [
        d.ignored.length === 1 ? "One link was " : `${formatInt(d.ignored.length)} links were `,
        "seen 5+ times and never clicked, like ",
        ...where({ ...ig, text: ig.text, dest: ig.dest }),
        ` (seen ${formatInt(ig.seen)} times). Reword it, make it a button, or drop it.`,
      ],
    });
  }
  return out;
}
