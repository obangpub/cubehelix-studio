import type { LightnessCurve } from "./types";

export const DEFAULT_POWER_GAMMA = 1;
export const DEFAULT_SIGMOID_STEEPNESS = 4;
export const DEFAULT_SIGMOID_MIDPOINT = 0.5;
export const DEFAULT_BEZIER_P1: readonly [number, number] = [1 / 3, 1 / 3];
export const DEFAULT_BEZIER_P2: readonly [number, number] = [2 / 3, 2 / 3];

export const DEFAULT_LIGHTNESS_CURVE: LightnessCurve = {
  kind: "power",
  gamma: DEFAULT_POWER_GAMMA,
};

export function evaluateLightnessCurve(curve: LightnessCurve, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  switch (curve.kind) {
    case "power":
      return Math.pow(t, curve.gamma);
    case "sigmoid":
      return evaluateSigmoid(t, curve.steepness, curve.midpoint);
    case "bezier":
      return evaluateBezier(t, curve.p1, curve.p2);
  }
}

// Inverse of evaluateLightnessCurve: returns u in [0,1] such that
// evaluateLightnessCurve(curve, u) ≈ target. Assumes curves are monotonic
// non-decreasing (true for power gamma>0, sigmoid, and bezier with valid p1/p2).
export function invertLightnessCurve(curve: LightnessCurve, target: number): number {
  if (target <= 0) return 0;
  if (target >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (evaluateLightnessCurve(curve, mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function evaluateSigmoid(t: number, steepness: number, midpoint: number): number {
  if (steepness === 0) return t;
  const a = logistic(steepness * (0 - midpoint));
  const b = logistic(steepness * (1 - midpoint));
  if (b === a) return t;
  return (logistic(steepness * (t - midpoint)) - a) / (b - a);
}

// Bezier: cubic with P0=(0,0), P1=(p1.x, p1.y), P2=(p2.x, p2.y), P3=(1,1).
// Monotonic (and therefore well-defined as y(x)) when 0 <= p1.x <= p2.x <= 1.
function evaluateBezier(
  t: number,
  p1: readonly [number, number],
  p2: readonly [number, number],
): number {
  const s = bezierSolveS(t, p1[0], p2[0]);
  return bezierComponent(s, p1[1], p2[1]);
}

function bezierComponent(s: number, c1: number, c2: number): number {
  const omS = 1 - s;
  return 3 * omS * omS * s * c1 + 3 * omS * s * s * c2 + s * s * s;
}

function bezierComponentDeriv(s: number, c1: number, c2: number): number {
  const omS = 1 - s;
  return 3 * omS * omS * c1 + 6 * omS * s * (c2 - c1) + 3 * s * s * (1 - c2);
}

function bezierSolveS(target: number, x1: number, x2: number): number {
  let s = target;
  for (let i = 0; i < 8; i++) {
    const x = bezierComponent(s, x1, x2) - target;
    if (Math.abs(x) < 1e-12) return s;
    const dx = bezierComponentDeriv(s, x1, x2);
    if (Math.abs(dx) < 1e-12) break;
    s -= x / dx;
    if (s < 0) s = 0;
    else if (s > 1) s = 1;
  }
  let lo = 0;
  let hi = 1;
  s = target;
  for (let i = 0; i < 32; i++) {
    const x = bezierComponent(s, x1, x2);
    if (Math.abs(x - target) < 1e-12) return s;
    if (x < target) lo = s;
    else hi = s;
    s = (lo + hi) / 2;
  }
  return s;
}
