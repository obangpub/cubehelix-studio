import { describe, expect, test } from "vitest";
import { DEFAULT_CUBEHELIX_PARAMS, cubehelix, cubehelixRaw } from "../src/cubehelix";
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
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 0,
      rotations: 5,
      saturation: 5,
      gamma: 1,
    };
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
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 0,
      rotations: 0,
      saturation: 0,
      gamma: 1,
    };
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const { r, g, b } = cubehelix(t, params);
      expect(r).toBeCloseTo(t, 12);
      expect(g).toBeCloseTo(t, 12);
      expect(b).toBeCloseTo(t, 12);
    }
  });

  test("cubehelixRaw equals cubehelix when channels are in [0,1]", () => {
    const params: CubehelixParams = DEFAULT_CUBEHELIX_PARAMS;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const raw = cubehelixRaw(t, params);
      const clamped = cubehelix(t, params);
      expect(clamped.r).toBeCloseTo(raw.r, 12);
      expect(clamped.g).toBeCloseTo(raw.g, 12);
      expect(clamped.b).toBeCloseTo(raw.b, 12);
    }
  });

  test("cubehelixRaw produces out-of-gamut values at high saturation", () => {
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 0,
      rotations: 1,
      saturation: 4,
      gamma: 1,
    };
    let sawOutOfGamut = false;
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const { r, g, b } = cubehelixRaw(t, params);
      if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
        sawOutOfGamut = true;
        break;
      }
    }
    expect(sawOutOfGamut).toBe(true);
  });

  test("cubehelix clamps cubehelixRaw to [0,1] per channel", () => {
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 0,
      rotations: 1,
      saturation: 4,
      gamma: 1,
    };
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const raw = cubehelixRaw(t, params);
      const clamped = cubehelix(t, params);
      expect(clamped.r).toBeCloseTo(Math.min(1, Math.max(0, raw.r)), 12);
      expect(clamped.g).toBeCloseTo(Math.min(1, Math.max(0, raw.g)), 12);
      expect(clamped.b).toBeCloseTo(Math.min(1, Math.max(0, raw.b)), 12);
    }
  });
});
