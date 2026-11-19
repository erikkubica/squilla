import { describe, expect, it } from "vitest";
import type { RecEvent } from "../api/types";
import { buildTimeline, clock, lerp, shortSelector, skipIdle } from "./replay";

const ev: RecEvent[] = [
  [0, "s", 0, 0],
  [100, "m", 10, 10],
  [200, "m", 20, 30],
  [900, "c", 50, 50, "body>main:nth-of-type(1)>a:nth-of-type(2)", "https://x.test/pricing"],
  [1000, "c", 52, 51, "body>main:nth-of-type(1)>button:nth-of-type(1)", 0],
  [1100, "c", 51, 49, "body>main:nth-of-type(1)>button:nth-of-type(1)", 0],
  [9000, "s", 0, 700],
  [9500, "v", 0],
  [9600, "l"],
  [9700, "l"],
  [9800, "x"],
];

describe("buildTimeline", () => {
  const tl = buildTimeline(ev, 1280, 800);
  it("finds clicks, rage clicks and idle time", () => {
    expect(tl.duration).toBe(9800);
    expect(tl.clicks).toHaveLength(3);
    expect(tl.moments.map((m) => m.kind)).toEqual(["click", "click", "rage", "hidden", "leave", "exit"]);
    expect(tl.idle).toEqual([[1100, 9000]]);
    expect(tl.mouse.at(-1)).toEqual([1100, 51, 49]);
  });
  it("interpolates the cursor between close samples", () => {
    expect(lerp(tl.mouse, 150)).toEqual([15, 20]);
    expect(lerp(tl.scroll, 5000)).toEqual([0, 0]); // held across the pause
  });
  it("skips idle stretches", () => {
    expect(skipIdle(tl.idle, 2000)).toBe(8500);
    expect(skipIdle(tl.idle, 500)).toBe(500);
  });
});

describe("helpers", () => {
  it("shortens selectors and formats time", () => {
    expect(shortSelector("body>main:nth-of-type(1)>a:nth-of-type(2)")).toBe("main › a");
    expect(shortSelector("#cta>span:nth-of-type(1)")).toBe("#cta › span");
    expect(clock(65_400)).toBe("1:05");
  });
});

describe("frustration and vitals events", () => {
  it("shows dead clicks and errors as moments, keeps vitals, and doesn't count them as activity", () => {
    const tl = buildTimeline(
      [
        [0, "s", 0, 0],
        [100, "w", "lcp", 2100],
        [500, "c", 5, 5, "body>img:nth-of-type(1)", 0],
        [1500, "k", 5, 5, "body>img:nth-of-type(1)"],
        [6000, "e", "x is not defined", "app.js", 12],
        [6100, "w", "lcp", 2600],
        [9000, "m", 1, 1],
      ],
      1280,
      800,
    );
    expect(tl.moments.map((m) => m.kind)).toEqual(["click", "dead", "error"]);
    expect(tl.moments[2].detail).toBe("x is not defined · app.js:12");
    expect(tl.vitals.lcp).toBe(2600);
    expect(tl.idle).toEqual([[1500, 9000]]);
  });
});
