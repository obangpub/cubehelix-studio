import { describe, expect, test } from "vitest";
import { chromaEnvelope } from "../src/chroma-envelope";
import { DEFAULT_CUBEHELIX_PARAMS, cubehelix, cubehelixRaw, saturationCap } from "../src/cubehelix";
import { evaluateLightnessCurve } from "../src/lightness-curve";
import type { CubehelixParams, LightnessCurve } from "../src/types";

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

  test("lightnessMin and lightnessMax bound the achromatic ramp endpoints", () => {
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      saturation: 0,
      lightnessMin: 0.2,
      lightnessMax: 0.8,
    };
    const lo = cubehelix(0, params);
    const hi = cubehelix(1, params);
    expect(lo.r).toBeCloseTo(0.2, 12);
    expect(lo.g).toBeCloseTo(0.2, 12);
    expect(lo.b).toBeCloseTo(0.2, 12);
    expect(hi.r).toBeCloseTo(0.8, 12);
    expect(hi.g).toBeCloseTo(0.8, 12);
    expect(hi.b).toBeCloseTo(0.8, 12);
  });
});

describe("saturationCap", () => {
  test("returns a finite positive number for default params", () => {
    const cap = saturationCap(DEFAULT_CUBEHELIX_PARAMS);
    expect(cap).toBeGreaterThan(0);
    expect(Number.isFinite(cap)).toBe(true);
  });

  test("at sat=cap, at least 95% of samples have a channel out of gamut", () => {
    const cap = saturationCap(DEFAULT_CUBEHELIX_PARAMS);
    const params: CubehelixParams = { ...DEFAULT_CUBEHELIX_PARAMS, saturation: cap };
    let outCount = 0;
    let total = 0;
    for (let i = 0; i <= 256; i++) {
      const t = i / 256;
      const { r, g, b } = cubehelixRaw(t, params);
      total++;
      if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) outCount++;
    }
    expect(outCount / total).toBeGreaterThanOrEqual(0.94);
  });

  test("at sat=0.5*cap, the fraction out of gamut is meaningfully smaller", () => {
    const cap = saturationCap(DEFAULT_CUBEHELIX_PARAMS);
    const params: CubehelixParams = { ...DEFAULT_CUBEHELIX_PARAMS, saturation: cap * 0.5 };
    let outCount = 0;
    let total = 0;
    for (let i = 0; i <= 256; i++) {
      const t = i / 256;
      const { r, g, b } = cubehelixRaw(t, params);
      total++;
      if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) outCount++;
    }
    expect(outCount / total).toBeLessThan(0.9);
  });

  test("is invariant to reverse", () => {
    const a = saturationCap(DEFAULT_CUBEHELIX_PARAMS);
    const b = saturationCap({ ...DEFAULT_CUBEHELIX_PARAMS, reverse: true });
    expect(a).toBeCloseTo(b, 9);
  });
});

describe("evaluateLightnessCurve", () => {
  test("power(gamma=1) is the identity map", () => {
    const curve: LightnessCurve = { kind: "power", gamma: 1 };
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(evaluateLightnessCurve(curve, t)).toBeCloseTo(t, 12);
    }
  });

  test("every curve kind maps endpoints to 0 and 1", () => {
    const curves: LightnessCurve[] = [
      { kind: "power", gamma: 0.7 },
      { kind: "sigmoid", steepness: 6, midpoint: 0.3 },
      { kind: "bezier", p1: [0.3, 0.1], p2: [0.7, 0.9] },
    ];
    for (const curve of curves) {
      expect(evaluateLightnessCurve(curve, 0)).toBe(0);
      expect(evaluateLightnessCurve(curve, 1)).toBe(1);
    }
  });

  test("sigmoid is monotonically non-decreasing", () => {
    const curve: LightnessCurve = { kind: "sigmoid", steepness: 8, midpoint: 0.4 };
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = evaluateLightnessCurve(curve, i / 100);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = v;
    }
  });

  test("sigmoid steepness=0 collapses to linear", () => {
    const curve: LightnessCurve = { kind: "sigmoid", steepness: 0, midpoint: 0.5 };
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(evaluateLightnessCurve(curve, t)).toBeCloseTo(t, 12);
    }
  });

  test("bezier with default handles is the identity map", () => {
    const curve: LightnessCurve = {
      kind: "bezier",
      p1: [1 / 3, 1 / 3],
      p2: [2 / 3, 2 / 3],
    };
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(evaluateLightnessCurve(curve, t)).toBeCloseTo(t, 9);
    }
  });

  test("bezier with monotonic-x handles is monotonically non-decreasing", () => {
    const curve: LightnessCurve = { kind: "bezier", p1: [0.4, 0.0], p2: [0.6, 1.0] };
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = evaluateLightnessCurve(curve, i / 100);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });
});

describe("chromaEnvelope", () => {
  const defaults = { chromaPeak: 0.5, chromaWidth: 1, chromaFloor: 0 };

  test("collapses to f*(1-f)/2 at default params", () => {
    for (let i = 0; i <= 20; i++) {
      const f = i / 20;
      const expected = (f * (1 - f)) / 2;
      expect(chromaEnvelope(f, defaults)).toBeCloseTo(expected, 12);
    }
  });

  test("peaks at chromaPeak with the calibrated peak amplitude", () => {
    for (const peak of [0.2, 0.5, 0.7]) {
      const params = { chromaPeak: peak, chromaWidth: 1, chromaFloor: 0 };
      const envAt = chromaEnvelope(peak, params);
      expect(envAt).toBeCloseTo(0.125, 9);
      const before = chromaEnvelope(Math.max(0.001, peak - 0.05), params);
      const after = chromaEnvelope(Math.min(0.999, peak + 0.05), params);
      expect(envAt).toBeGreaterThan(before - 1e-12);
      expect(envAt).toBeGreaterThan(after - 1e-12);
    }
  });

  test("non-zero chromaFloor lifts the envelope at endpoints", () => {
    const floor = 0.25;
    const env = chromaEnvelope(0, { chromaPeak: 0.5, chromaWidth: 1, chromaFloor: floor });
    expect(env).toBeCloseTo(floor * 0.125, 12);
  });

  test("narrowing chromaWidth concentrates the envelope near the peak", () => {
    const wide = { chromaPeak: 0.5, chromaWidth: 2, chromaFloor: 0 };
    const narrow = { chromaPeak: 0.5, chromaWidth: 0.5, chromaFloor: 0 };
    const offPeak = 0.2;
    expect(chromaEnvelope(offPeak, narrow)).toBeLessThan(chromaEnvelope(offPeak, wide));
    expect(chromaEnvelope(0.5, narrow)).toBeCloseTo(0.125, 9);
    expect(chromaEnvelope(0.5, wide)).toBeCloseTo(0.125, 9);
  });

  test("non-default chromaFloor + non-zero saturation gives endpoints non-zero chroma", () => {
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      saturation: 1,
      chromaFloor: 0.5,
    };
    const c = cubehelix(0, params);
    const allZero = c.r === 0 && c.g === 0 && c.b === 0;
    expect(allZero).toBe(false);
  });
});
