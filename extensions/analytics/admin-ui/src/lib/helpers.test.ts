import { describe, expect, it } from "vitest";
import { addMonths, allowedIntervals, autoInterval, compareRange, endOfMonth, isIsoDate, rangeDays, resolveRange } from "./dates";
import { compact, flagEmoji, percent, relativeDelta, signedPercent } from "./format";
import { apiQuery, carryParams, effectiveInterval, parseViewState, writeViewState } from "./params";
import { heatStep, niceTicks } from "../charts/scale";
import { pivotTimeseries, groupTotals } from "./bots";
import { slugify, validateGoal, validateLink } from "../pages/goals/validation";

describe("dates", () => {
  const today = "2026-03-31";
  it("resolves presets inclusively", () => {
    expect(resolveRange("today", today)).toEqual({ from: today, to: today });
    expect(resolveRange("7d", today)).toEqual({ from: "2026-03-25", to: today });
    expect(rangeDays(resolveRange("30d", today))).toBe(30);
    expect(resolveRange("month", today)).toEqual({ from: "2026-03-01", to: today });
    expect(resolveRange("last_month", today)).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(resolveRange("12mo", today)).toEqual({ from: "2025-04-01", to: today });
  });
  it("orders and validates custom ranges", () => {
    expect(resolveRange("custom", today, { from: "2026-02-10", to: "2026-01-01" })).toEqual({ from: "2026-01-01", to: "2026-02-10" });
    expect(resolveRange("custom", today, { from: "2026-02-30" })).toEqual(resolveRange("30d", today));
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });
  it("clamps month math", () => {
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
  });
  it("computes compare ranges", () => {
    expect(compareRange({ from: "2026-03-01", to: "2026-03-07" }, "previous")).toEqual({ from: "2026-02-22", to: "2026-02-28" });
    expect(compareRange({ from: "2026-03-01", to: "2026-03-07" }, "year")).toEqual({ from: "2025-03-01", to: "2025-03-07" });
  });
  it("picks sensible intervals", () => {
    expect(autoInterval({ from: today, to: today })).toBe("hour");
    expect(autoInterval(resolveRange("30d", today))).toBe("day");
    expect(autoInterval(resolveRange("12mo", today))).toBe("month");
    expect(allowedIntervals({ from: today, to: today })).toEqual(["hour", "day"]);
  });
});

describe("format", () => {
  it("compacts numbers", () => {
    expect(compact(950)).toBe("950");
    expect(compact(1000)).toBe("1K");
    expect(compact(1250)).toBe("1.3K");
    expect(compact(12900)).toBe("12.9K");
    expect(compact(4_200_000)).toBe("4.2M");
    expect(compact(2.5)).toBe("2.5");
  });
  it("formats rates and deltas", () => {
    expect(percent(0.4567)).toBe("45.7%");
    expect(percent(0.0004)).toBe("<0.1%");
    expect(relativeDelta(120, 100)).toBeCloseTo(0.2);
    expect(relativeDelta(5, 0)).toBeNull();
    expect(signedPercent(0.2)).toBe("+20%");
    expect(signedPercent(-0.051)).toBe("−5.1%");
  });
  it("builds flag emoji", () => {
    expect(flagEmoji("vn")).toBe("🇻🇳");
    expect(flagEmoji("XYZ")).toBe("");
  });
});

describe("url state", () => {
  it("round-trips view state and drops defaults", () => {
    const sp = writeViewState(new URLSearchParams(), { preset: "7d", compare: "previous", filters: { country: "VN" }, metric: "pageviews" });
    expect(sp.toString()).toBe("period=7d&compare=previous&f.country=VN&metric=pageviews");
    const st = parseViewState(sp);
    expect(st.preset).toBe("7d");
    expect(st.filters).toEqual({ country: "VN" });
    const back = writeViewState(sp, { preset: "30d", metric: "visitors", compare: null, filters: {} });
    expect(back.toString()).toBe("");
  });
  it("ignores unknown filters and bad values", () => {
    const st = parseViewState(new URLSearchParams("period=bogus&f.evil=1&f.page=/x&interval=year"));
    expect(st.preset).toBe("30d");
    expect(st.filters).toEqual({ page: "/x" });
    expect(st.interval).toBeNull();
  });
  it("builds API query and carries shared params", () => {
    const sp = new URLSearchParams("period=custom&from=2026-01-01&to=2026-01-02&interval=week&f.device=mobile&t.pages=entry_page");
    const st = parseViewState(sp);
    const range = { from: "2026-01-01", to: "2026-01-02" };
    expect(effectiveInterval(st, range)).toBe("hour");
    expect(apiQuery(st, range).toString()).toBe("from=2026-01-01&to=2026-01-02&f.device=mobile");
    expect(carryParams(sp)).toBe("?period=custom&from=2026-01-01&to=2026-01-02&f.device=mobile");
  });
});

describe("charts & misc", () => {
  it("makes clean ticks", () => {
    expect(niceTicks(87)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });
  it("quantizes heat steps", () => {
    expect(heatStep(0, 10)).toBe(0);
    expect(heatStep(10, 10)).toBe(7);
    expect(heatStep(1, 100)).toBe(1);
  });
  it("folds bot categories into fixed groups", () => {
    expect(groupTotals([{ category: "probe", hits: 3 }, { category: "headless", hits: 2 }, { category: "search", hits: 1 }]).other).toBe(5);
    const p = pivotTimeseries([{ t: "2026-01-02", category: "search", hits: 1 }, { t: "2026-01-01", category: "probe", hits: 2 }]);
    expect(p.map((x) => x.t)).toEqual(["2026-01-01", "2026-01-02"]);
  });
  it("validates goals and links", () => {
    expect(slugify("WhatsApp Booking!")).toBe("whatsapp-booking");
    expect(validateGoal({ name: "x", kind: "request", path_pattern: "forms", method: "POST", link_slug: "" }).path_pattern).toBeTruthy();
    expect(Object.keys(validateLink({ slug: "wa", label: "WA", destination: "https://wa.me/1" }))).toEqual([]);
    expect(validateLink({ slug: "Bad Slug", label: "", destination: "javascript:alert(1)" })).toMatchObject({ slug: expect.any(String), label: expect.any(String), destination: expect.any(String) });
  });
});
