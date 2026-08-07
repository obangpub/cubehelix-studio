import {
  cubehelix,
  DEFAULT_LIGHTNESS_CURVE,
  toCssRgb,
  type CubehelixParams,
} from "@cubehelix-studio/core";

// Geometry and color helpers shared by the hue-wheel controls (the freeform
// StartingHueWheel and the waypoint HueDualWheel). The wheel is a pure-hue
// reference dial: angle encodes the cubehelix starting hue, and each segment is
// the abstract hue for that start at maximum visible chroma. Keeping the
// geometry here means both controls stay in lockstep and neither inlines helix
// math (see docs/renderer-core-boundary.md — color still comes from core's
// cubehelix()).

export const SEGMENT_COUNT = 60;
export const OUTER_RADIUS = 1;
export const INNER_RADIUS = 0.6;

// Pin sampling so each segment shows the abstract hue for that start.
// Rotations=0 makes the angle equal to 2π·(start/3 + 1) regardless of helix
// position; sampling at t=0.5 with the default identity curve puts the
// lightness fraction at 0.5, where the chroma envelope peaks. Together, the
// segment color is the mathematically pure starting hue at maximum visible
// chroma — it does not depend on the user's rotation count.
export const REFERENCE_T = 0.5;

// Maximum saturation that keeps every hue in [0, 1] at fraction=0.5 with the
// default chroma envelope. The binding constraint is along the B direction at
// angle 0 or π (|B_dir| = 1.97294, peak amplitude 0.125):
//   s_max = 0.5 / (0.125 · 1.97294) ≈ 2.027
// 2.0 leaves a tiny floating-point buffer.
export const WHEEL_SATURATION = 2.0;

function wheelParams(start: number): CubehelixParams {
  return {
    start,
    rotations: 0,
    saturationMin: WHEEL_SATURATION,
    saturationMax: WHEEL_SATURATION,
    lightnessCurve: DEFAULT_LIGHTNESS_CURVE,
    lightnessAxisMin: 0,
    lightnessAxisMax: 1,
    chromaPeak: 0.5,
    chromaWidth: 1,
    chromaFloor: 0,
    reverse: false,
  };
}

/** Wheel angle (radians, clockwise from the top) for a `start` in [0, 3). */
export function angleAt(start: number): number {
  return (start / 3) * 2 * Math.PI;
}

export function pointFromAngle(angle: number, radius: number): { x: number; y: number } {
  return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius };
}

function arcSegmentPath(angleStart: number, angleEnd: number): string {
  const o0 = pointFromAngle(angleStart, OUTER_RADIUS);
  const o1 = pointFromAngle(angleEnd, OUTER_RADIUS);
  const i0 = pointFromAngle(angleStart, INNER_RADIUS);
  const i1 = pointFromAngle(angleEnd, INNER_RADIUS);
  return `M ${o0.x} ${o0.y} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${i0.x} ${i0.y} Z`;
}

/** The pure-hue color shown at wheel position `start` (in [0, 3)). */
export function hueColorAt(start: number): string {
  return toCssRgb(cubehelix(REFERENCE_T, wheelParams(start)));
}

/** The fixed ring of colored hue segments (memoize at the call site). */
export function hueRingSegments(): { path: string; color: string }[] {
  const out: { path: string; color: string }[] = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const segStart = ((i + 0.5) / SEGMENT_COUNT) * 3;
    const color = hueColorAt(segStart);
    const a0 = (i / SEGMENT_COUNT) * 2 * Math.PI;
    const a1 = ((i + 1) / SEGMENT_COUNT) * 2 * Math.PI;
    out.push({ path: arcSegmentPath(a0, a1), color });
  }
  return out;
}
