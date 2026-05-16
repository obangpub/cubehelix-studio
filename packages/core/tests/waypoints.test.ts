import { describe, expect, test } from "vitest";
import { cubehelix, DEFAULT_CUBEHELIX_PARAMS } from "../src/cubehelix";
import { invertLightnessCurve } from "../src/lightness-curve";
import type { CubehelixParams } from "../src/types";
import {
  findWindingForRotations,
  huesAtT,
  MAX_ROTATIONS,
  solveHueWaypoints,
  type HueWaypoint,
  type SolverContext,
} from "../src/waypoints";

function defaultCtx(over?: Partial<SolverContext>): SolverContext {
  return {
    lightnessCurve: DEFAULT_CUBEHELIX_PARAMS.lightnessCurve,
    lightnessAxisMin: DEFAULT_CUBEHELIX_PARAMS.lightnessAxisMin,
    lightnessAxisMax: DEFAULT_CUBEHELIX_PARAMS.lightnessAxisMax,
    reverse: DEFAULT_CUBEHELIX_PARAMS.reverse,
    ...over,
  };
}

function angleInTurnsAtT(params: CubehelixParams, t: number): number {
  const uMin = invertLightnessCurve(params.lightnessCurve, params.lightnessAxisMin);
  const uMax = invertLightnessCurve(params.lightnessCurve, params.lightnessAxisMax);
  const tEff = params.reverse ? 1 - t : t;
  const u = uMin + (uMax - uMin) * tEff;
  const a = params.start / 3 + params.rotations * u + 1;
  return a - Math.floor(a);
}

describe("solveHueWaypoints", () => {
  test("places both waypoints at requested hues for winding=0", () => {
    const w1: HueWaypoint = { t: 0.25, hue: 0.1 };
    const w2: HueWaypoint = { t: 0.75, hue: 0.7 };
    const ctx = defaultCtx();
    const solved = solveHueWaypoints(w1, w2, 0, ctx);
    expect(solved).not.toBeNull();
    const params: CubehelixParams = { ...DEFAULT_CUBEHELIX_PARAMS, ...solved! };
    expect(angleInTurnsAtT(params, w1.t)).toBeCloseTo(w1.hue, 10);
    expect(angleInTurnsAtT(params, w2.t)).toBeCloseTo(w2.hue, 10);
  });

  test("winding integer shifts rotations by 1/(u2 - u1) but hues are still satisfied modulo 1", () => {
    const w1: HueWaypoint = { t: 0.2, hue: 0.3 };
    const w2: HueWaypoint = { t: 0.8, hue: 0.5 };
    const ctx = defaultCtx();
    const a = solveHueWaypoints(w1, w2, 0, ctx)!;
    const b = solveHueWaypoints(w1, w2, 1, ctx)!;
    const c = solveHueWaypoints(w1, w2, -1, ctx)!;
    // Different windings produce visibly different rotation counts.
    expect(a.rotations).not.toBeCloseTo(b.rotations, 6);
    expect(a.rotations).not.toBeCloseTo(c.rotations, 6);
    for (const s of [a, b, c]) {
      const params: CubehelixParams = { ...DEFAULT_CUBEHELIX_PARAMS, ...s };
      expect(angleInTurnsAtT(params, w1.t)).toBeCloseTo(w1.hue, 10);
      expect(angleInTurnsAtT(params, w2.t)).toBeCloseTo(w2.hue, 10);
    }
  });

  test("returns null when winding forces rotations past MAX_ROTATIONS", () => {
    const w1: HueWaypoint = { t: 0.2, hue: 0.3 };
    const w2: HueWaypoint = { t: 0.8, hue: 0.5 };
    const ctx = defaultCtx();
    // du = 0.6 here, so each winding step adds ~1.67 rotations; a winding of
    // 100 demands ~167 rotations — unreadable as a palette, and rejected.
    expect(solveHueWaypoints(w1, w2, 100, ctx)).toBeNull();
    // A winding that stays within the cap still solves.
    const solved = solveHueWaypoints(w1, w2, 5, ctx);
    expect(solved).not.toBeNull();
    expect(Math.abs(solved!.rotations)).toBeLessThanOrEqual(MAX_ROTATIONS);
  });

  test("returns null when waypoint t's collapse to identical u", () => {
    const w: HueWaypoint = { t: 0.5, hue: 0.3 };
    expect(solveHueWaypoints(w, { ...w, hue: 0.4 }, 0, defaultCtx())).toBeNull();
  });

  test("returns null when lightness axis collapses both u's regardless of t", () => {
    const w1: HueWaypoint = { t: 0.2, hue: 0.1 };
    const w2: HueWaypoint = { t: 0.8, hue: 0.7 };
    const ctx = defaultCtx({ lightnessAxisMin: 0.5, lightnessAxisMax: 0.5 });
    expect(solveHueWaypoints(w1, w2, 0, ctx)).toBeNull();
  });

  test("respects reverse: same waypoints under reverse mirror the helix path", () => {
    const w1: HueWaypoint = { t: 0.25, hue: 0.2 };
    const w2: HueWaypoint = { t: 0.75, hue: 0.6 };
    const forward = solveHueWaypoints(w1, w2, 0, defaultCtx({ reverse: false }))!;
    const reversed = solveHueWaypoints(w1, w2, 0, defaultCtx({ reverse: true }))!;
    const fwdParams: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      ...forward,
      reverse: false,
    };
    const revParams: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      ...reversed,
      reverse: true,
    };
    // Both palettes must place the requested hues at the requested visible-t.
    expect(angleInTurnsAtT(fwdParams, w1.t)).toBeCloseTo(w1.hue, 10);
    expect(angleInTurnsAtT(fwdParams, w2.t)).toBeCloseTo(w2.hue, 10);
    expect(angleInTurnsAtT(revParams, w1.t)).toBeCloseTo(w1.hue, 10);
    expect(angleInTurnsAtT(revParams, w2.t)).toBeCloseTo(w2.hue, 10);
  });

  test("solved palette is in-gamut at the waypoints when waypoints came from a valid palette", () => {
    // Sample a known-valid palette, extract two of its hues as waypoints,
    // solve back, and verify the colors at those t's match within tolerance.
    const source = DEFAULT_CUBEHELIX_PARAMS;
    const [h1, h2] = huesAtT(source, [0.25, 0.75]);
    const w1: HueWaypoint = { t: 0.25, hue: h1! };
    const w2: HueWaypoint = { t: 0.75, hue: h2! };
    const winding = findWindingForRotations(w1, w2, source.rotations, defaultCtx());
    const solved = solveHueWaypoints(w1, w2, winding, defaultCtx())!;
    expect(solved.start).toBeCloseTo(source.start, 8);
    expect(solved.rotations).toBeCloseTo(source.rotations, 8);
    const params: CubehelixParams = { ...source, ...solved };
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const a = cubehelix(t, params);
      const b = cubehelix(t, source);
      expect(a.r).toBeCloseTo(b.r, 10);
      expect(a.g).toBeCloseTo(b.g, 10);
      expect(a.b).toBeCloseTo(b.b, 10);
    }
  });
});

describe("huesAtT", () => {
  test("returns the cubehelix angle in turns at each requested t", () => {
    const params = DEFAULT_CUBEHELIX_PARAMS;
    const hues = huesAtT(params, [0, 0.5, 1]);
    expect(hues).toHaveLength(3);
    for (const h of hues) {
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
  });

  test("respects reverse symmetry: huesAtT(reverse, t) === huesAtT(forward, 1 - t)", () => {
    const forward: CubehelixParams = { ...DEFAULT_CUBEHELIX_PARAMS, reverse: false };
    const reversed: CubehelixParams = { ...DEFAULT_CUBEHELIX_PARAMS, reverse: true };
    const ts = [0, 0.25, 0.5, 0.75, 1];
    const hForward = huesAtT(forward, ts);
    const hReversed = huesAtT(
      reversed,
      ts.map((t) => 1 - t),
    );
    for (let i = 0; i < ts.length; i++) {
      expect(hReversed[i]).toBeCloseTo(hForward[i]!, 10);
    }
  });
});

describe("findWindingForRotations", () => {
  test("round-trips with solveHueWaypoints for non-degenerate inputs", () => {
    const w1: HueWaypoint = { t: 0.2, hue: 0.15 };
    const w2: HueWaypoint = { t: 0.8, hue: 0.55 };
    const ctx = defaultCtx();
    // With default lightness axis [0, 1] and power gamma 1, uMin=0 and uMax=1
    // so du = t2 - t1 = 0.6. Each integer winding shifts rotations by 1/du,
    // so the nearest integer-winding solution is within (1/du)/2 of the target.
    const du = w2.t - w1.t;
    const halfStep = 0.5 / du;
    for (const target of [-2, -1.5, -1, 0, 0.5, 1, 2]) {
      const n = findWindingForRotations(w1, w2, target, ctx);
      const solved = solveHueWaypoints(w1, w2, n, ctx)!;
      expect(Math.abs(solved.rotations - target)).toBeLessThanOrEqual(halfStep + 1e-9);
    }
  });
});
