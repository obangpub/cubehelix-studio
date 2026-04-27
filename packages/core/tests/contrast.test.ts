import { describe, expect, test } from "vitest";
import { contrastRatio, pickTextColor } from "../src/contrast";
import type { RGB } from "../src/types";

const WHITE: RGB = { r: 1, g: 1, b: 1 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

describe("contrastRatio", () => {
  test("white vs black is 21:1", () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 6);
  });

  test("identical colors yield 1:1", () => {
    const c: RGB = { r: 0.42, g: 0.71, b: 0.18 };
    expect(contrastRatio(c, c)).toBeCloseTo(1, 12);
  });

  test("symmetric in argument order", () => {
    const a: RGB = { r: 0.5, g: 0.2, b: 0.8 };
    const b: RGB = { r: 0.1, g: 0.9, b: 0.3 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 12);
  });

  test("pure red vs white matches WCAG calculator (~3.998)", () => {
    const red: RGB = { r: 1, g: 0, b: 0 };
    expect(contrastRatio(red, WHITE)).toBeCloseTo(3.998, 2);
  });
});

describe("pickTextColor", () => {
  test("on black background returns white", () => {
    expect(pickTextColor(BLACK)).toEqual(WHITE);
  });

  test("on white background returns black", () => {
    expect(pickTextColor(WHITE)).toEqual(BLACK);
  });

  test("on dark gray returns white", () => {
    expect(pickTextColor({ r: 0.2, g: 0.2, b: 0.2 })).toEqual(WHITE);
  });

  test("on light gray returns black", () => {
    expect(pickTextColor({ r: 0.85, g: 0.85, b: 0.85 })).toEqual(BLACK);
  });

  test("respects custom candidate set", () => {
    const blue: RGB = { r: 0, g: 0, b: 0.6 };
    const yellow: RGB = { r: 1, g: 1, b: 0 };
    const lightBg: RGB = { r: 0.9, g: 0.9, b: 0.9 };
    expect(pickTextColor(lightBg, [blue, yellow])).toEqual(blue);
  });

  test("rejects empty candidate list", () => {
    expect(() => pickTextColor(BLACK, [])).toThrow(RangeError);
  });
});
