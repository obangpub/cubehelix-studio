import { describe, expect, test } from "vitest";
import { applyPreview, PREVIEW_MODES, type PreviewMode } from "../src/cvd";

const SAMPLES = [
  { r: 0, g: 0, b: 0 },
  { r: 1, g: 1, b: 1 },
  { r: 0.5, g: 0.5, b: 0.5 },
  { r: 1, g: 0, b: 0 },
  { r: 0, g: 1, b: 0 },
  { r: 0, g: 0, b: 1 },
  { r: 0.25, g: 0.6, b: 0.85 },
];

describe("applyPreview", () => {
  test("normal mode is identity", () => {
    for (const c of SAMPLES) {
      expect(applyPreview(c, "normal")).toEqual(c);
    }
  });

  test("grayscale produces equal R, G, B", () => {
    for (const c of SAMPLES) {
      const out = applyPreview(c, "grayscale");
      expect(out.r).toBeCloseTo(out.g, 12);
      expect(out.g).toBeCloseTo(out.b, 12);
    }
  });

  test("grayscale of pure white is white; of pure black is black", () => {
    expect(applyPreview({ r: 1, g: 1, b: 1 }, "grayscale")).toEqual({ r: 1, g: 1, b: 1 });
    expect(applyPreview({ r: 0, g: 0, b: 0 }, "grayscale")).toEqual({ r: 0, g: 0, b: 0 });
  });

  test.each(PREVIEW_MODES.filter((m): m is PreviewMode => m !== "normal"))(
    "%s preview keeps channels in [0, 1]",
    (mode) => {
      for (const c of SAMPLES) {
        const out = applyPreview(c, mode);
        expect(out.r).toBeGreaterThanOrEqual(0);
        expect(out.r).toBeLessThanOrEqual(1);
        expect(out.g).toBeGreaterThanOrEqual(0);
        expect(out.g).toBeLessThanOrEqual(1);
        expect(out.b).toBeGreaterThanOrEqual(0);
        expect(out.b).toBeLessThanOrEqual(1);
      }
    },
  );

  test("white survives every CVD transform as approximately white", () => {
    const white = { r: 1, g: 1, b: 1 };
    for (const mode of ["protanopia", "deuteranopia", "tritanopia"] as const) {
      const out = applyPreview(white, mode);
      expect(out.r).toBeCloseTo(1, 6);
      expect(out.g).toBeCloseTo(1, 6);
      expect(out.b).toBeCloseTo(1, 6);
    }
  });

  test("black maps to black under every CVD transform", () => {
    const black = { r: 0, g: 0, b: 0 };
    for (const mode of ["protanopia", "deuteranopia", "tritanopia"] as const) {
      expect(applyPreview(black, mode)).toEqual(black);
    }
  });

  test("CVD transforms are deterministic", () => {
    const c = { r: 0.4, g: 0.7, b: 0.2 };
    for (const mode of ["protanopia", "deuteranopia", "tritanopia"] as const) {
      expect(applyPreview(c, mode)).toEqual(applyPreview(c, mode));
    }
  });

  test("PREVIEW_MODES contains exactly the expected modes", () => {
    expect(PREVIEW_MODES).toEqual([
      "normal",
      "grayscale",
      "protanopia",
      "deuteranopia",
      "tritanopia",
    ]);
  });
});
