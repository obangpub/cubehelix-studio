import { describe, expect, test } from "vitest";
import { toCssRgb, toHex } from "../src/format";

describe("toHex", () => {
  test("white", () => {
    expect(toHex({ r: 1, g: 1, b: 1 })).toBe("#ffffff");
  });

  test("black", () => {
    expect(toHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
  });

  test("rounds to nearest integer per channel", () => {
    expect(toHex({ r: 0.5, g: 0.5, b: 0.5 })).toBe("#808080");
  });

  test("zero-pads single-hex-digit channels", () => {
    expect(toHex({ r: 1 / 255, g: 0, b: 0 })).toBe("#010000");
  });
});

describe("toCssRgb", () => {
  test("modern space-separated syntax", () => {
    expect(toCssRgb({ r: 1, g: 0.5, b: 0 })).toBe("rgb(255 128 0)");
  });

  test("rounds to integers", () => {
    expect(toCssRgb({ r: 0.999, g: 0.001, b: 0.5 })).toBe("rgb(255 0 128)");
  });
});
