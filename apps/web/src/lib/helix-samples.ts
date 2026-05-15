import {
  cubehelixRaw,
  evaluateLightnessCurve,
  invertLightnessCurve,
  type CubehelixParams,
  type RGB,
} from "@cubehelix-studio/core";
import { clamp01 } from "./math";

/** One point sampled along the full helix, with its gamut and range status. */
export interface Sample {
  /** Helix parameter in [0, 1], black to white. */
  u: number;
  /** Raw (possibly out-of-gamut) cube-space color. */
  raw: RGB;
  /** `raw` clamped into the unit cube. */
  clamped: RGB;
  /** Whether `raw` lies inside the RGB cube. */
  inGamut: boolean;
  /** Whether this `u` falls in the user's visible lightness window. */
  inRange: boolean;
}

/** Bisection steps used to locate a gamut crossing between two samples. */
const BISECT_ITER = 6;

export function isInGamut(c: RGB): boolean {
  return c.r >= 0 && c.r <= 1 && c.g >= 0 && c.g <= 1 && c.b >= 0 && c.b <= 1;
}

/** Bisect for the `u` where the helix crosses the gamut boundary. */
export function bisectCrossing(
  uLo: number,
  uHi: number,
  inLo: boolean,
  params: CubehelixParams,
): number {
  let lo = uLo;
  let hi = uHi;
  for (let i = 0; i < BISECT_ITER; i++) {
    const mid = (lo + hi) / 2;
    const inMid = isInGamut(cubehelixRaw(mid, params));
    if (inMid === inLo) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Sample the full helix at `n + 1` points, inserting extra samples at the
 * lightness-window breakpoints and at gamut crossings so the rendered tube
 * starts and stops exactly on those boundaries.
 */
export function buildSamples(params: CubehelixParams, n: number): Sample[] {
  // Cube viz renders the full underlying helix as a fixed object in cube
  // space, parameterized over u in [0,1] from black to white, then marks
  // which segments fall in the user's visible lightness range. The visible
  // palette is the sub-arc where the curve output lies in [lightnessAxisMin,
  // lightnessAxisMax]. Stripping lightness-range AND reverse here lets cubehelixRaw
  // return colors at the helix parameter u directly: with range [0,1] and
  // reverse=false, the function's input t maps 1:1 to u. Keeping reverse here
  // would double-reverse and paint mismatched hues against the swatches.
  const fullHelixParams: CubehelixParams = {
    ...params,
    lightnessAxisMin: 0,
    lightnessAxisMax: 1,
    reverse: false,
  };
  const { lightnessCurve, lightnessAxisMin, lightnessAxisMax } = params;

  const makeAt = (u: number): Sample => {
    const raw = cubehelixRaw(u, fullHelixParams);
    const clamped = { r: clamp01(raw.r), g: clamp01(raw.g), b: clamp01(raw.b) };
    const lightness = evaluateLightnessCurve(lightnessCurve, u);
    return {
      u,
      raw,
      clamped,
      inGamut: isInGamut(raw),
      inRange: lightness >= lightnessAxisMin && lightness <= lightnessAxisMax,
    };
  };

  const base: Sample[] = [];
  for (let i = 0; i <= n; i++) {
    base.push(makeAt(i / n));
  }

  const breakpoints: number[] = [];
  if (lightnessAxisMin > 0)
    breakpoints.push(invertLightnessCurve(lightnessCurve, lightnessAxisMin));
  if (lightnessAxisMax < 1)
    breakpoints.push(invertLightnessCurve(lightnessCurve, lightnessAxisMax));
  for (const u of breakpoints) {
    if (u <= 0 || u >= 1) continue;
    const idx = base.findIndex((s) => s.u >= u);
    if (idx === -1) base.push(makeAt(u));
    else if (base[idx]!.u !== u) base.splice(idx, 0, makeAt(u));
  }

  const out: Sample[] = [base[0]!];
  for (let i = 0; i < base.length - 1; i++) {
    const a = base[i]!;
    const b = base[i + 1]!;
    if (a.inGamut !== b.inGamut) {
      const uCross = bisectCrossing(a.u, b.u, a.inGamut, fullHelixParams);
      out.push(makeAt(uCross));
    } else {
      // Both endpoints share the same gamut state. Probe the midpoint to
      // catch sub-sample excursions (helix dips out and back within one
      // sample interval at high saturation + extreme gamma).
      const mid = makeAt((a.u + b.u) / 2);
      if (mid.inGamut !== a.inGamut) {
        const uEnter = bisectCrossing(a.u, mid.u, a.inGamut, fullHelixParams);
        const uExit = bisectCrossing(mid.u, b.u, mid.inGamut, fullHelixParams);
        out.push(makeAt(uEnter));
        out.push(mid);
        out.push(makeAt(uExit));
      }
    }
    out.push(b);
  }
  return out;
}
