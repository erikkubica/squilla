import { expect, request, test } from "@playwright/test";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "LocalTest-1234";

// One scripted visit per browser; afterwards the analytics API must show it.
test("a scripted visit shows up as views, section reach, stay and clicks", async ({ page, browserName, baseURL }) => {
  await page.goto("/en");
  await sleep(1500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const details = page.locator("main details:not([open]) > summary").first();
  if (await details.count()) {
    await details.scrollIntoViewIfNeeded();
    await details.click();
  }
  await sleep(10_500); // first dwell mark at 10 s
  const link = page.locator('a[href^="/experiences/"]').first();
  const href = await link.getAttribute("href", { timeout: 5000 });
  await link.click();
  await page.waitForLoadState("load");
  await sleep(4500); // activation of the second page + one flush (2 s)
  test.info().annotations.push({ type: "visit", description: `${browserName}: clicked ${href}` });

  const api = await request.newContext({ baseURL });
  expect((await api.post("/auth/login", { data: { email: EMAIL, password: PASSWORD } })).ok()).toBeTruthy();
  const get = async (p: string) => (await (await api.get(`/admin/api/ext/analytics/${p}`)).json()) as Record<string, any>;
  const sum = await get("summary");
  expect(sum.current.pageviews).toBeGreaterThanOrEqual(2);
  const pg = await get("page?path=/en");
  expect(pg.views).toBeGreaterThanOrEqual(1);
  expect(pg.activated_views).toBeGreaterThanOrEqual(1);
  expect(pg.stay.some((s: any) => s.sec === 10)).toBeTruthy();
  const keys = pg.blocks.map((b: any) => b.block_key);
  if (browserName !== "firefox") expect(keys).toContain("hero.0");
  const cl = await get("clicks");
  if (browserName !== "firefox") expect(cl.totals.clicks).toBeGreaterThanOrEqual(1);
  const st = await get("status");
  expect(st.signals_lost).toBe(0);
});
