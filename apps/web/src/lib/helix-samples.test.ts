import { describe, expect, test } from "vitest";
import {
  DEFAULT_CUBEHELIX_PARAMS,
  evaluateLightnessCurve,
  type CubehelixParams,
} from "@cubehelix-studio/core";
import { buildSamples, isInGamut } from "./helix-samples";

describe("isInGamut", () => {
  test("is true inside the unit cube and false outside", () => {
    expect(isInGamut({ r: 0, g: 0.5, b: 1 })).toBe(true);
    expect(isInGamut({ r: -0.01, g: 0.5, b: 0.5 })).toBe(false);
    expect(isInGamut({ r: 0.5, g: 1.5, b: 0.5 })).toBe(false);
  });
});

describe("buildSamples", () => {
  test("returns samples ordered by ascending u, spanning [0, 1]", () => {
    const samples = buildSamples(DEFAULT_CUBEHELIX_PARAMS, 32);
    expect(samples.length).toBeGreaterThanOrEqual(33);
    expect(samples[0]!.u).toBe(0);
    expect(samples[samples.length - 1]!.u).toBe(1);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!.u).toBeGreaterThanOrEqual(samples[i - 1]!.u);
    }
  });

  test("inserts a sample at each lightness-axis breakpoint", () => {
    // The default lightness curve is power gamma 1, so a breakpoint's u sits at
    // the axis bound (within the inversion solver's tolerance). Neither 0.3 nor
    // 0.7 lands on a base sample at n = 32, so each must have been inserted.
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessAxisMin: 0.3,
      lightnessAxisMax: 0.7,
    };
    const us = buildSamples(params, 32).map((s) => s.u);
    expect(us.some((u) => Math.abs(u - 0.3) < 1e-6)).toBe(true);
    expect(us.some((u) => Math.abs(u - 0.7) < 1e-6)).toBe(true);
  });

  test("flags inRange by the visible lightness window", () => {
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessAxisMin: 0.3,
      lightnessAxisMax: 0.7,
    };
    for (const s of buildSamples(params, 32)) {
      const lightness = evaluateLightnessCurve(params.lightnessCurve, s.u);
      expect(s.inRange).toBe(lightness >= 0.3 && lightness <= 0.7);
    }
  });

  test("an achromatic palette never leaves gamut", () => {
    const gray: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      saturationMin: 0,
      saturationMax: 0,
    };
    expect(buildSamples(gray, 48).every((s) => s.inGamut)).toBe(true);
  });

  test("a high-saturation palette leaves gamut, and crossings land on a cube face", () => {
    const vivid: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      saturationMin: 4,
      saturationMax: 4,
    };
    const samples = buildSamples(vivid, 48);
    expect(samples.some((s) => !s.inGamut)).toBe(true);
    expect(samples.some((s) => s.inGamut)).toBe(true);
    // At every in/out transition the builder inserts a bisected crossing
    // sample, whose raw color should sit on a cube face (a channel at 0 or 1).
    for (let i = 1; i < samples.length; i++) {
      if (samples[i]!.inGamut === samples[i - 1]!.inGamut) continue;
      const onFace = [samples[i - 1]!, samples[i]!].some((s) =>
        [s.raw.r, s.raw.g, s.raw.b].some((c) => Math.abs(c) < 0.03 || Math.abs(c - 1) < 0.03),
      );
      expect(onFace).toBe(true);
    }
  });

  test("clamped color always stays within the unit cube", () => {
    const vivid: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      saturationMin: 4,
      saturationMax: 4,
    };
    for (const s of buildSamples(vivid, 32)) {
      for (const c of [s.clamped.r, s.clamped.g, s.clamped.b]) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});
