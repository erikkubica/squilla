import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

type Hit = { t: number; method: string; path: string; query: Record<string, string>; referer: string | null; pingFrom: string | null; pingTo: string | null; secPurpose: string | null; fetchSite: string | null; ua: string | null; lang: string | null };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function hits(page: Page): Promise<Hit[]> {
  return JSON.parse(await (await page.request.get("/__log")).text());
}
const find = (h: Hit[], path: string, q: Record<string, string> = {}) =>
  h.filter((x) => x.path === path && Object.entries(q).every(([k, v]) => x.query[k] === v));

const results: Record<string, unknown> = {};
test.afterAll(async ({}, info) => {
  mkdirSync("results", { recursive: true });
  writeFileSync(`results/${info.project.name}.json`, JSON.stringify(results, null, 2));
});

test.beforeEach(async ({ page }) => {
  await page.request.get("/__reset");
});

test("activation fires once, ~1 s after load; viewport and scheme arrive separately", async ({ page }) => {
  const t0 = Date.now();
  await page.goto("/page");
  await sleep(2500);
  const h = await hits(page);
  const a = find(h, "/_s/b");
  const m = find(h, "/_s/m");
  results.activation = a.map((x) => ({ t: x.t, q: x.query, referer: x.referer }));
  results.viewport = m.map((x) => ({ t: x.t, q: x.query }));
  expect(a.length).toBe(1);
  expect(a[0].referer).toContain("/page");
  expect(m.length).toBe(1);
  expect(m[0].query.w).toBe("l");
  expect(m[0].t).toBeLessThan(a[0].t); // device facts at load, activation after the timer
  expect(Date.now() - t0).toBeGreaterThan(1000);
});

test("dwell marks arrive on a server-side clock, one per mark", async ({ page }) => {
  await page.goto("/page");
  await sleep(11_500);
  const t = find(await hits(page), "/_s/t");
  results.dwell = t.map((x) => ({ t: x.t, s: x.query.s }));
  expect(t.map((x) => x.query.s)).toEqual(["10"]);
});

test("section beacons fire for what scrolls into view, once, also after scroll-back", async ({ page, browserName }) => {
  await page.goto("/page");
  await sleep(1800); // sections are silent for the first second
  const first = find(await hits(page), "/_s/v").map((x) => x.query.k);
  for (const y of [1200, 2400, 3600]) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(500);
  }
  for (const y of [2400, 1200, 0]) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(400);
  }
  const all = find(await hits(page), "/_s/v").map((x) => x.query.k);
  results.sections = { atLoad: first, afterScroll: all, end: find(await hits(page), "/_s/e").length };
  test.info().annotations.push({ type: "sections", description: JSON.stringify(results.sections) });
  // Browsers without scroll-driven animations legitimately send nothing.
  results.scrollTimelines = await page.evaluate(() => CSS.supports("animation-timeline", "view()") && CSS.supports("timeline-scope", "--a"));
  if (browserName === "firefox") {
    expect(all).toEqual([]);
    return;
  }
  expect(first).toEqual(["bv-hero.0"]); // only what is in view at load, not everything at once
  expect(new Set(all)).toEqual(new Set(["bv-hero.0", "bv-tours.0", "bv-faq.0", "bv-contact.0"]));
  expect(all.length).toBe(new Set(all).size);
});

test("opening an FAQ item and focusing a form fire :has() beacons, items open at start do not", async ({ page }) => {
  await page.goto("/page");
  await sleep(1800);
  await page.locator("#q2 summary").scrollIntoViewIfNeeded();
  await page.locator("#q2 summary").click();
  await page.locator("#name").scrollIntoViewIfNeeded();
  await page.locator("#name").focus();
  await sleep(700);
  const i = find(await hits(page), "/_s/i");
  results.has = i.map((x) => ({ k: x.query.k, t: x.query.t }));
  const hasSupport = await page.evaluate(() => CSS.supports("selector(:has(*))"));
  if (!hasSupport) test.skip(true, ":has() unsupported");
  expect(i.map((x) => x.query.t).sort()).toEqual(["d", "f"]);
});

test("link ping: internal, outbound, mailto, noreferrer — what arrives and from where", async ({ page, browserName }) => {
  const out: Record<string, unknown> = {};
  for (const id of ["to-tours", "mail", "ext", "wa"]) {
    await page.request.get("/__reset");
    await page.goto("/page");
    await sleep(300);
    await page.route("**/*", (r) => (r.request().url().startsWith("http://127.0.0.1:4789") ? r.continue() : r.abort()));
    const popup = page.context().waitForEvent("page", { timeout: 1500 }).catch(() => null);
    await page.locator(`#${id}`).click({ noWaitAfter: true }).catch(() => {});
    await popup;
    await sleep(800);
    const c = find(await hits(page), "/_s/c");
    out[id] = c.map((x) => ({ method: x.method, k: x.query.k, p: x.query.p, pingFrom: x.pingFrom, pingTo: x.pingTo, referer: x.referer }));
  }
  results.ping = out;
  test.info().annotations.push({ type: "ping", description: `${browserName}: ${JSON.stringify(out)}` });
  const sent = (out["to-tours"] as unknown[]).length;
  if (browserName === "firefox") expect(sent).toBe(0);
});

test("beacon requests carry the same UA and language as the document (visitor hash inputs)", async ({ page }) => {
  let docUA = "";
  page.on("request", (r) => { if (r.url().endsWith("/page")) docUA = r.headers()["user-agent"] ?? ""; });
  await page.goto("/page");
  await sleep(1800);
  const b = find(await hits(page), "/_s/m")[0];
  results.hashInputs = { sameUA: b?.ua === docUA, lang: b?.lang };
  expect(b?.ua).toBe(docUA);
});

test("prefers-reduced-motion: the theme's animation reset does not stop the beacons", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", baseURL });
  const page = await ctx.newPage();
  await page.goto("/page");
  await sleep(2200);
  const h = await hits(page);
  results.reducedMotion = { activation: find(h, "/_s/b").length, dwell: find(h, "/_s/t").length };
  await ctx.close();
  expect(find(h, "/_s/b").length).toBe(1);
});

test("a page loaded in a background tab: when do the beacons fire?", async ({ context, page }) => {
  await page.goto("/about");
  await page.request.get("/__reset");
  const bg = await context.newPage();
  await bg.goto("/page");
  await bg.bringToFront().catch(() => {});
  await page.bringToFront();
  await sleep(2500);
  results.backgroundTab = { visibilityOfBackground: await bg.evaluate(() => document.visibilityState), activation: find(await hits(page), "/_s/b").length };
  test.info().annotations.push({ type: "background", description: JSON.stringify(results.backgroundTab) });
});
