import { invertLightnessCurve } from "./lightness-curve";
import type { CubehelixParams, LightnessCurve } from "./types";

// A hue waypoint pins the cubehelix angle at a given visible-palette position.
// `t` is in [0, 1] in the user's visible palette space (post-reverse). `hue`
// is in turns [0, 1) — the same units as the normalized cubehelix angle
// (start/3 + rotations · u + 1, taken mod 1).
export interface HueWaypoint {
  t: number;
  hue: number;
}

// Solver input shape — pull out only the fields the solver needs from
// CubehelixParams so callers can mix and match.
export interface SolverContext {
  lightnessCurve: LightnessCurve;
  lightnessAxisMin: number;
  lightnessAxisMax: number;
  reverse: boolean;
}

// Closed-form solution. Given two waypoints in visible-palette space, plus an
// integer `winding`, return the (start, rotations) pair that places those hues
// at those positions. Returns null when the waypoints are degenerate (same t
// and reverse make u_i collide).
export function solveHueWaypoints(
  w1: HueWaypoint,
  w2: HueWaypoint,
  winding: number,
  ctx: SolverContext,
): { start: number; rotations: number } | null {
  const uMin = invertLightnessCurve(ctx.lightnessCurve, ctx.lightnessAxisMin);
  const uMax = invertLightnessCurve(ctx.lightnessCurve, ctx.lightnessAxisMax);
  const tEff1 = ctx.reverse ? 1 - w1.t : w1.t;
  const tEff2 = ctx.reverse ? 1 - w2.t : w2.t;
  const u1 = uMin + (uMax - uMin) * tEff1;
  const u2 = uMin + (uMax - uMin) * tEff2;
  const du = u2 - u1;
  if (Math.abs(du) < 1e-12) return null;
  // Reduce the hue difference to [-0.5, 0.5] turns so winding=0 is the
  // shortest path between the two angles.
  const reducedDiff = w2.hue - w1.hue - Math.round(w2.hue - w1.hue);
  const rotations = (reducedDiff + winding) / du;
  // Solve start: start/3 + rotations · u1 + 1 ≡ hue1 (mod 1)
  const startTurnsRaw = w1.hue - rotations * u1 - 1;
  const startTurns = startTurnsRaw - Math.floor(startTurnsRaw);
  const start = mod3(startTurns * 3);
  return { start, rotations };
}

// Return the cubehelix angle (in turns, normalized to [0, 1)) at the given
// visible-palette positions for the supplied params. Used to seed waypoints
// from the current palette when switching authoring modes.
export function huesAtT(params: CubehelixParams, ts: readonly number[]): number[] {
  const uMin = invertLightnessCurve(params.lightnessCurve, params.lightnessAxisMin);
  const uMax = invertLightnessCurve(params.lightnessCurve, params.lightnessAxisMax);
  return ts.map((t) => {
    const tEff = params.reverse ? 1 - t : t;
    const u = uMin + (uMax - uMin) * tEff;
    const angleTurns = params.start / 3 + params.rotations * u + 1;
    return angleTurns - Math.floor(angleTurns);
  });
}

// Inverse of solveHueWaypoints' winding choice: given two waypoints and a
// target rotations value (e.g. the user's existing freeform rotations), return
// the integer winding that produces those rotations through the solver.
export function findWindingForRotations(
  w1: HueWaypoint,
  w2: HueWaypoint,
  targetRotations: number,
  ctx: SolverContext,
): number {
  const uMin = invertLightnessCurve(ctx.lightnessCurve, ctx.lightnessAxisMin);
  const uMax = invertLightnessCurve(ctx.lightnessCurve, ctx.lightnessAxisMax);
  const tEff1 = ctx.reverse ? 1 - w1.t : w1.t;
  const tEff2 = ctx.reverse ? 1 - w2.t : w2.t;
  const u1 = uMin + (uMax - uMin) * tEff1;
  const u2 = uMin + (uMax - uMin) * tEff2;
  const du = u2 - u1;
  if (Math.abs(du) < 1e-12) return 0;
  const reducedDiff = w2.hue - w1.hue - Math.round(w2.hue - w1.hue);
  // rotations · du = reducedDiff + winding  ⇒  winding = rotations · du - reducedDiff
  return Math.round(targetRotations * du - reducedDiff);
}

function mod3(v: number): number {
  return ((v % 3) + 3) % 3;
}
