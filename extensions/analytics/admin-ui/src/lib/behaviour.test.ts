import { describe, expect, it } from "vitest";
import { blockName, pct, reasonLabel, seconds } from "./behaviour";

describe("behaviour helpers", () => {
  it("names blocks and layout partials", () => {
    expect(blockName("bv-wall-of-love.0")).toBe("Wall of love");
    expect(blockName("p.default-cta")).toBe("Default CTA (shared)");
    expect(blockName("n")).toBe("Menu");
    expect(blockName("x")).toBe("Elsewhere on the page");
    expect(blockName("hero.0", "Hero banner")).toBe("Hero banner");
    expect(blockName("image-text.1")).toBe("Image text 2");
  });
  it("formats shares and durations", () => {
    expect(pct(1, 3)).toBe("33.3%");
    expect(pct(1, 0)).toBe("—");
    expect(seconds(null)).toBe("—");
    expect(seconds(45)).toBe("45 s");
    expect(seconds(125)).toBe("2 min 5 s");
  });
  it("labels exit reasons, falling back to the raw key", () => {
    expect(reasonLabel("left_to_contact")).toBe("Left to contact us");
    expect(reasonLabel("something_new")).toBe("something_new");
  });
});
