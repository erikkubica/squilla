// Plain-language findings for the Overview, built from reports the page
// already loads. Pure functions so the wording rules are testable.
import type { BehaviourSummary, BotsResponse, BreakdownRow, Goal, SummaryResponse } from "../api/types";
import { channelInfo } from "./channels";
import { formatInt, relativeDelta } from "./format";

export type Tone = "good" | "bad" | "warn" | "info" | "neutral";
export type InsightIcon = "up" | "down" | "source" | "page" | "phone" | "ai" | "broken" | "goal" | "engaged";
/** Text pieces; `{ b }` is rendered bold. */
export type Part = string | { b: string };

export interface Insight {
  id: string;
  tone: Tone;
  icon: InsightIcon;
  parts: Part[];
  link?: { to: string; label: string };
}

export interface InsightInput {
  /** "in the last 30 days", "today", "between Oct 3 and Oct 9" */
  rangePhrase: string;
  /** "the 30 days before", "the day before" */
  prevPhrase: string;
  summary: SummaryResponse | null;
  channels: BreakdownRow[] | null;
  pages: BreakdownRow[] | null;
  devices: BreakdownRow[] | null;
  notFound: BreakdownRow[] | null;
  notFoundTotal: number;
  goals: Goal[] | null;
  goalRows: BreakdownRow[] | null;
  bots: BotsResponse | null;
  behaviour: BehaviourSummary | null;
  /** Route builders, so this module stays free of router imports. */
  links: { visitors: string; pages: string; page: (path: string) => string; goals: string; newGoal: string; bots: string; engagement: string };
}

const pct = (share: number) => `${Math.round(share * 100)}%`;
const plural = (n: number, one: string, many: string) => `${formatInt(n)} ${n === 1 ? one : many}`;
const topBy = (rows: BreakdownRow[] | null, key: "visitors" | "pageviews" | "conversions") =>
  [...(rows ?? [])].filter((r) => r.value).sort((a, b) => Number(b[key]) - Number(a[key]))[0];

/** "Most found you through …" / "The biggest group came straight to your site …". */
function channelSentence(value: string, phrase: string, share: number): Part[] {
  const who = share >= 0.5 ? "Most" : "The biggest group";
  if (value === "direct") {
    return [`${who} came `, { b: "straight to your site" }, ` (${pct(share)}): they typed the address, used a bookmark or tapped a link in an app.`];
  }
  return [`${who} found you through `, { b: phrase }, ` (${pct(share)}).`];
}

/** One sentence (or three) summing up the period. Null when nothing to say. */
export function buildSummary(i: InsightInput): Part[] | null {
  const cur = i.summary?.current;
  if (!cur || cur.visitors <= 0) return null;
  const parts: Part[] = [{ b: plural(cur.visitors, "person", "people") }, ` visited your site ${i.rangePhrase}`];
  const prev = i.summary?.previous;
  const d = prev ? relativeDelta(cur.visitors, prev.visitors) : null;
  if (d != null && Math.abs(d) >= 0.01) {
    parts.push(", ", { b: `${Math.round(Math.abs(d) * 100)}% ${d > 0 ? "more" : "fewer"}` }, ` than ${i.prevPhrase}`);
  }
  parts.push(". ", "They viewed ", { b: plural(cur.pageviews, "page", "pages") });
  if (cur.conversions > 0) parts.push(" and reached your goals ", { b: plural(cur.conversions, "time", "times") });
  parts.push(".");
  const top = topBy(i.channels, "visitors");
  const info = top && channelInfo(top.value);
  if (top && info && top.share >= 0.2) parts.push(" ", ...channelSentence(top.value, info.phrase, top.share));
  return parts;
}

/** Up to `max` findings, most useful first; `skip` drops ids already said elsewhere. */
export function buildInsights(i: InsightInput, max = 5, skip: string[] = []): Insight[] {
  const out: Insight[] = [];
  const cur = i.summary?.current;
  const prev = i.summary?.previous;

  // 1. Is traffic going up or down?
  if (cur && prev && prev.visitors >= 5) {
    const d = relativeDelta(cur.visitors, prev.visitors);
    if (d != null && Math.abs(d) >= 0.05) {
      out.push({
        id: "trend",
        tone: d > 0 ? "good" : "bad",
        icon: d > 0 ? "up" : "down",
        parts: ["Visitors are ", { b: `${d > 0 ? "up" : "down"} ${Math.round(Math.abs(d) * 100)}%` }, ` compared with ${i.prevPhrase}.`],
      });
    }
  }

  // 2. Something is broken: people land on pages that don't exist.
  if (i.notFound && i.notFound.length > 0) {
    const hits = i.notFound.reduce((a, r) => a + Number(r.pageviews || 0), 0);
    const count = Math.max(i.notFoundTotal, i.notFound.length);
    out.push({
      id: "broken",
      tone: "warn",
      icon: "broken",
      parts: [
        "People tried to open ",
        { b: plural(count, "page that doesn’t exist", "pages that don’t exist") },
        ` ${plural(hits, "time", "times")}. Fix the links pointing to them, or redirect them to a page that does exist.`,
      ],
      link: { to: `${i.links.pages}#missing`, label: "See missing pages" },
    });
  }

  // 3. Where visitors come from.
  const topCh = topBy(i.channels, "visitors");
  const ch = topCh && channelInfo(topCh.value);
  if (topCh && ch) {
    out.push({
      id: "source",
      tone: "info",
      icon: "source",
      parts: channelSentence(topCh.value, ch.phrase, topCh.share),
      link: { to: i.links.visitors, label: "See all sources" },
    });
  }

  // 4. The page people open most.
  const topPage = topBy(i.pages, "pageviews");
  if (topPage) {
    out.push({
      id: "page",
      tone: "neutral",
      icon: "page",
      parts: ["Your most viewed page is ", { b: topPage.label && topPage.label !== topPage.value ? topPage.label : topPage.value }, ` with ${plural(Number(topPage.pageviews), "view", "views")}.`],
      link: { to: i.links.page(topPage.value), label: "See how people use it" },
    });
  }

  // 5. Goals: none yet, or the one reached most.
  if (i.goals && i.goals.length === 0) {
    out.push({
      id: "goal-setup",
      tone: "info",
      icon: "goal",
      parts: ["You haven’t set up any goals yet. Add one to count sent forms, WhatsApp chats or booking clicks."],
      link: { to: i.links.newGoal, label: "Add a goal" },
    });
  } else if (i.goals && i.goals.length > 0) {
    const topGoal = topBy(i.goalRows, "conversions");
    if (topGoal && Number(topGoal.conversions) > 0) {
      out.push({
        id: "goal",
        tone: "good",
        icon: "goal",
        parts: [{ b: topGoal.label || topGoal.value }, ` is your most reached goal: ${plural(Number(topGoal.conversions), "time", "times")} ${i.rangePhrase}.`],
        link: { to: i.links.goals, label: "See all goals" },
      });
    } else if (cur && cur.visitors > 0) {
      out.push({
        id: "goal-none",
        tone: "neutral",
        icon: "goal",
        parts: [`None of your goals were reached ${i.rangePhrase}.`],
        link: { to: i.links.goals, label: "Check your goals" },
      });
    }
  }

  // 6. How engaged visits are (needs finished visits).
  const b = i.behaviour;
  if (b && b.visits >= 10) {
    const share = b.engaged / b.visits;
    out.push(
      share < 0.4
        ? { id: "engaged", tone: "warn", icon: "engaged", parts: ["Only ", { b: pct(share) }, " of visits went beyond a quick look. See which pages people leave quickly."], link: { to: i.links.engagement, label: "See how visits end" } }
        : { id: "engaged", tone: "good", icon: "engaged", parts: [{ b: pct(share) }, " of visits were engaged: people stayed at least 10 seconds, opened another page or reached a goal."], link: { to: i.links.engagement, label: "See engagement" } },
    );
  }

  // 7. Phones.
  const devTotal = (i.devices ?? []).reduce((a, r) => a + Number(r.visitors || 0), 0);
  const mobile = (i.devices ?? []).find((r) => r.value === "mobile");
  if (mobile && devTotal >= 10 && Number(mobile.visitors) / devTotal >= 0.5) {
    out.push({
      id: "phone",
      tone: "neutral",
      icon: "phone",
      parts: [{ b: pct(Number(mobile.visitors) / devTotal) }, " of visitors use a phone, so check your pages on a small screen."],
    });
  }

  // 8. AI assistants reading pages on someone's behalf.
  const ai = (i.bots?.totals ?? []).find((t) => t.category === "ai_assistant")?.hits ?? 0;
  if (ai > 0) {
    out.push({
      id: "ai",
      tone: "info",
      icon: "ai",
      parts: ["AI assistants like ChatGPT read your pages ", { b: plural(ai, "time", "times") }, " to answer someone’s question."],
      link: { to: i.links.bots, label: "See Bots & AI" },
    });
  }

  return out.filter((x) => !skip.includes(x.id)).slice(0, max);
}

/**
 * Share of visits no in-page signal confirmed, when it is large enough to
 * distort the report (scrapers posing as browsers). Null otherwise, and
 * when in-page measurement is off or the report already shows confirmed
 * visits only (`confirmed` is then absent).
 */
export function unconfirmedShare(summary: SummaryResponse | null | undefined): number | null {
  const all = summary?.current.visits ?? 0;
  const confirmed = summary?.confirmed?.visits;
  if (confirmed == null || all < 20) return null;
  const share = 1 - Math.min(confirmed, all) / all;
  return share >= 0.5 ? share : null;
}
