import { describe, expect, test } from "vitest";
import { DEFAULT_CUBEHELIX_PARAMS, cubehelix } from "../src/cubehelix";
import type { CubehelixParams } from "../src/types";

describe("cubehelix", () => {
  test("at t=0 with default params returns black", () => {
    const c = cubehelix(0, DEFAULT_CUBEHELIX_PARAMS);
    expect(c.r).toBeCloseTo(0, 12);
    expect(c.g).toBeCloseTo(0, 12);
    expect(c.b).toBeCloseTo(0, 12);
  });

  test("at t=1 with default params returns white", () => {
    const c = cubehelix(1, DEFAULT_CUBEHELIX_PARAMS);
    expect(c.r).toBeCloseTo(1, 12);
    expect(c.g).toBeCloseTo(1, 12);
    expect(c.b).toBeCloseTo(1, 12);
  });

  test("clamps output channels into [0, 1]", () => {
    const params: CubehelixParams = { start: 0, rotations: 5, saturation: 5, gamma: 1 };
    for (let i = 0; i <= 50; i++) {
      const c = cubehelix(i / 50, params);
      expect(c.r).toBeGreaterThanOrEqual(0);
      expect(c.r).toBeLessThanOrEqual(1);
      expect(c.g).toBeGreaterThanOrEqual(0);
      expect(c.g).toBeLessThanOrEqual(1);
      expect(c.b).toBeGreaterThanOrEqual(0);
      expect(c.b).toBeLessThanOrEqual(1);
    }
  });

  test("non-decreasing perceptual lightness with default params", () => {
    let prev = -Infinity;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const { r, g, b } = cubehelix(t, DEFAULT_CUBEHELIX_PARAMS);
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      expect(lum).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = lum;
    }
  });

  test("saturation=0 yields a pure greyscale ramp", () => {
    const params: CubehelixParams = { start: 0, rotations: 0, saturation: 0, gamma: 1 };
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const { r, g, b } = cubehelix(t, params);
      expect(r).toBeCloseTo(t, 12);
      expect(g).toBeCloseTo(t, 12);
      expect(b).toBeCloseTo(t, 12);
    }
  });
});
