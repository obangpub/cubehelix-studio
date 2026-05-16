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

  test("a high-saturation palette leaves gamut, and bisected crossings land on a cube face", () => {
    const vivid: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      saturationMin: 4,
      saturationMax: 4,
    };
    const samples = buildSamples(vivid, 48);
    expect(samples.some((s) => !s.inGamut)).toBe(true);
    expect(samples.some((s) => s.inGamut)).toBe(true);
    // A bisected crossing sample is off the n = 48 grid and straddles a gamut
    // transition (its two neighbours differ). Assert the crossing sample
    // itself — not merely an adjacent base sample — lands on a cube face, so a
    // broken bisection cannot pass by luck of a nearby base sample.
    let crossings = 0;
    for (let i = 1; i < samples.length - 1; i++) {
      const onGrid = Math.abs(samples[i]!.u * 48 - Math.round(samples[i]!.u * 48)) < 1e-9;
      if (onGrid || samples[i - 1]!.inGamut === samples[i + 1]!.inGamut) continue;
      crossings++;
      const { r, g, b } = samples[i]!.raw;
      const onFace = [r, g, b].some((c) => Math.abs(c) < 0.03 || Math.abs(c - 1) < 0.03);
      expect(onFace).toBe(true);
    }
    expect(crossings).toBeGreaterThan(0);
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

  test("catches a sub-sample gamut excursion between two same-state base samples", () => {
    // At saturation 1.25 with gamma 0.8 the helix's blue channel pokes just
    // past 1 over a narrow u window (~0.77-0.81) that falls entirely between
    // the in-gamut base samples at u = 9/12 and 10/12. The simple adjacent-pair
    // crossing check would miss it; buildSamples must probe the interval
    // midpoint to catch the dip.
    const params: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      saturationMin: 1.25,
      saturationMax: 1.25,
      rotations: -1.5,
      lightnessCurve: { kind: "power", gamma: 0.8 },
    };
    const samples = buildSamples(params, 12);

    // The excursion midpoint is the one sample whose gamut state differs from
    // BOTH neighbours — the out-of-gamut probe flanked by its two bisected
    // boundary samples. A simple crossing never produces that pattern.
    const midIdx = samples.findIndex(
      (s, i) =>
        i > 0 &&
        i < samples.length - 1 &&
        s.inGamut !== samples[i - 1]!.inGamut &&
        s.inGamut !== samples[i + 1]!.inGamut,
    );
    expect(midIdx).toBeGreaterThan(0);

    const enter = samples[midIdx - 1]!;
    const mid = samples[midIdx]!;
    const exit = samples[midIdx + 1]!;
    // The two base samples on either side share gamut state; only the helix
    // between them left the cube.
    expect(enter.inGamut).toBe(exit.inGamut);
    expect(mid.inGamut).toBe(!enter.inGamut);
    // Both boundary samples are bisected crossings, so each lands on a face.
    for (const boundary of [enter, exit]) {
      const onFace = [boundary.raw.r, boundary.raw.g, boundary.raw.b].some(
        (c) => Math.abs(c) < 0.03 || Math.abs(c - 1) < 0.03,
      );
      expect(onFace).toBe(true);
    }
  });

  test("ignores the reverse flag — raw geometry samples the helix directly", () => {
    // buildSamples strips `reverse` before sampling cube-space geometry;
    // keeping it would double-reverse and paint mismatched hues against the
    // swatches. The samples must be identical whether or not `reverse` is set.
    const base: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      saturationMin: 2,
      saturationMax: 2,
    };
    const forward = buildSamples({ ...base, reverse: false }, 32);
    const reversed = buildSamples({ ...base, reverse: true }, 32);
    expect(reversed).toEqual(forward);
  });
});
