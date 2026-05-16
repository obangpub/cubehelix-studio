import {
  DEFAULT_BEZIER_P1,
  DEFAULT_BEZIER_P2,
  DEFAULT_CUBEHELIX_PARAMS,
  DEFAULT_LIGHTNESS_CURVE,
  DEFAULT_POWER_GAMMA,
  DEFAULT_SIGMOID_MIDPOINT,
  DEFAULT_SIGMOID_STEEPNESS,
  solveHueWaypoints,
  type CubehelixParams,
  type HueWaypoint,
  type LightnessCurve,
} from "@cubehelix-studio/core";
import { clamp, mod } from "./math";

export type HueAuthoringState =
  | { mode: "freeform" }
  | { mode: "waypoints"; waypoints: [HueWaypoint, HueWaypoint]; winding: number };

// Tier 1 / document state: the palette artifact itself. Membership in AppState
// means a field is URL-synced (encodeAppState/decodeAppState) and cleared by
// header Reset (handleReset -> DEFAULT_APP_STATE). The test for membership is
// "does this describe the exported palette?". Workspace preferences (theme,
// preview lens) and ephemeral widget state stay out of here; see App.handleReset.
export interface AppState {
  params: CubehelixParams;
  swatchCount: number;
  hueAuthoring: HueAuthoringState;
}

export const DEFAULT_SWATCH_COUNT = 9;
export const SWATCH_COUNT_BOUNDS = { min: 2, max: 20 } as const;
export const GAMMA_BOUNDS = { min: 0.5, max: 2 } as const;
export const SIGMOID_STEEPNESS_BOUNDS = { min: 0, max: 12 } as const;
export const SIGMOID_MIDPOINT_BOUNDS = { min: 0, max: 1 } as const;
export const BEZIER_COMPONENT_BOUNDS = { min: 0, max: 1 } as const;
export const CHROMA_PEAK_BOUNDS = { min: 0, max: 1 } as const;
export const CHROMA_WIDTH_BOUNDS = { min: 0.1, max: 5 } as const;
export const CHROMA_FLOOR_BOUNDS = { min: 0, max: 1 } as const;

export const DEFAULT_APP_STATE: AppState = {
  params: DEFAULT_CUBEHELIX_PARAMS,
  swatchCount: DEFAULT_SWATCH_COUNT,
  hueAuthoring: { mode: "freeform" },
};

type SimpleNumericKey =
  | "start"
  | "rotations"
  | "lightnessAxisMin"
  | "lightnessAxisMax"
  | "chromaPeak"
  | "chromaWidth"
  | "chromaFloor";

const NUMERIC_KEYS = [
  "start",
  "rotations",
  "lightnessAxisMin",
  "lightnessAxisMax",
  "chromaPeak",
  "chromaWidth",
  "chromaFloor",
] as const satisfies readonly SimpleNumericKey[];

const PARAM_BOUNDS: Record<SimpleNumericKey, { min: number; max: number }> = {
  start: { min: 0, max: 3 },
  rotations: { min: -Infinity, max: Infinity },
  lightnessAxisMin: { min: 0, max: 1 },
  lightnessAxisMax: { min: 0, max: 1 },
  chromaPeak: { min: 0, max: 1 },
  chromaWidth: { min: 0.1, max: 5 },
  chromaFloor: { min: 0, max: 1 },
};

const SATURATION_BOUNDS = { min: 0, max: Infinity } as const;

const ENCODE_PRECISION = 4;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function parseNumOr(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Read a numeric query param, clamped to `bounds`. Returns `null` when the key
 * is absent or unparseable, so callers can apply it only when present.
 */
function readClampedNum(
  search: URLSearchParams,
  key: string,
  bounds: { min: number; max: number },
): number | null {
  const raw = search.get(key);
  if (raw === null) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  return clamp(num, bounds.min, bounds.max);
}

/** Swap an inverted lightness axis so min ≤ max, keeping the window monotonic. */
function normalizeLightnessAxis(params: CubehelixParams): void {
  if (params.lightnessAxisMin > params.lightnessAxisMax) {
    [params.lightnessAxisMin, params.lightnessAxisMax] = [
      params.lightnessAxisMax,
      params.lightnessAxisMin,
    ];
  }
}

function readPairXY(
  search: URLSearchParams,
  xKey: string,
  yKey: string,
  fallback: readonly [number, number],
  bounds: { min: number; max: number },
): [number, number] {
  const x = parseNumOr(search.get(xKey), fallback[0]);
  const y = parseNumOr(search.get(yKey), fallback[1]);
  return [clamp(x, bounds.min, bounds.max), clamp(y, bounds.min, bounds.max)];
}

function writePairComponent(
  search: URLSearchParams,
  key: string,
  value: number,
  defaultValue: number,
): void {
  const rounded = roundTo(value, ENCODE_PRECISION);
  if (rounded !== roundTo(defaultValue, ENCODE_PRECISION)) {
    search.set(key, String(rounded));
  }
}

function appendCurveToSearch(search: URLSearchParams, curve: LightnessCurve): void {
  if (curve.kind !== DEFAULT_LIGHTNESS_CURVE.kind) {
    search.set("lightnessCurve", curve.kind);
  }
  switch (curve.kind) {
    case "power": {
      const rounded = roundTo(curve.gamma, ENCODE_PRECISION);
      if (rounded !== roundTo(DEFAULT_POWER_GAMMA, ENCODE_PRECISION)) {
        search.set("gamma", String(rounded));
      }
      break;
    }
    case "sigmoid": {
      const s = roundTo(curve.steepness, ENCODE_PRECISION);
      if (s !== roundTo(DEFAULT_SIGMOID_STEEPNESS, ENCODE_PRECISION)) {
        search.set("sigmoidSteepness", String(s));
      }
      const m = roundTo(curve.midpoint, ENCODE_PRECISION);
      if (m !== roundTo(DEFAULT_SIGMOID_MIDPOINT, ENCODE_PRECISION)) {
        search.set("sigmoidMidpoint", String(m));
      }
      break;
    }
    case "bezier": {
      writePairComponent(search, "bezier1x", curve.p1[0], DEFAULT_BEZIER_P1[0]);
      writePairComponent(search, "bezier1y", curve.p1[1], DEFAULT_BEZIER_P1[1]);
      writePairComponent(search, "bezier2x", curve.p2[0], DEFAULT_BEZIER_P2[0]);
      writePairComponent(search, "bezier2y", curve.p2[1], DEFAULT_BEZIER_P2[1]);
      break;
    }
  }
}

function readCurveFromSearch(search: URLSearchParams): LightnessCurve {
  const kindRaw = search.get("lightnessCurve");
  const kind = kindRaw === "sigmoid" || kindRaw === "bezier" ? kindRaw : "power";
  switch (kind) {
    case "power": {
      const gamma = clamp(
        parseNumOr(search.get("gamma"), DEFAULT_POWER_GAMMA),
        GAMMA_BOUNDS.min,
        GAMMA_BOUNDS.max,
      );
      return { kind: "power", gamma };
    }
    case "sigmoid": {
      const steepness = clamp(
        parseNumOr(search.get("sigmoidSteepness"), DEFAULT_SIGMOID_STEEPNESS),
        SIGMOID_STEEPNESS_BOUNDS.min,
        SIGMOID_STEEPNESS_BOUNDS.max,
      );
      const midpoint = clamp(
        parseNumOr(search.get("sigmoidMidpoint"), DEFAULT_SIGMOID_MIDPOINT),
        SIGMOID_MIDPOINT_BOUNDS.min,
        SIGMOID_MIDPOINT_BOUNDS.max,
      );
      return { kind: "sigmoid", steepness, midpoint };
    }
    case "bezier": {
      const p1 = readPairXY(
        search,
        "bezier1x",
        "bezier1y",
        DEFAULT_BEZIER_P1,
        BEZIER_COMPONENT_BOUNDS,
      );
      const p2 = readPairXY(
        search,
        "bezier2x",
        "bezier2y",
        DEFAULT_BEZIER_P2,
        BEZIER_COMPONENT_BOUNDS,
      );
      // The Bezier curve must stay monotonic in x for invertLightnessCurve's
      // bisection to be valid. The editor enforces p1.x <= p2.x on drag; a
      // hand-edited URL can violate it, so clamp p1.x down here to match.
      const p1x = Math.min(p1[0], p2[0]);
      return { kind: "bezier", p1: [p1x, p1[1]], p2 };
    }
  }
}

function appendParamsToSearch(search: URLSearchParams, params: CubehelixParams): void {
  for (const key of NUMERIC_KEYS) {
    const rounded = roundTo(params[key], ENCODE_PRECISION);
    const defaultRounded = roundTo(DEFAULT_CUBEHELIX_PARAMS[key], ENCODE_PRECISION);
    if (rounded !== defaultRounded) {
      search.set(key, String(rounded));
    }
  }
  // Saturation: emit a single `saturation` key when min === max (legacy-compat
  // shared links keep their familiar shape); emit `saturationMin` /
  // `saturationMax` only when split. Each component still default-omits.
  const minRounded = roundTo(params.saturationMin, ENCODE_PRECISION);
  const maxRounded = roundTo(params.saturationMax, ENCODE_PRECISION);
  const defaultMin = roundTo(DEFAULT_CUBEHELIX_PARAMS.saturationMin, ENCODE_PRECISION);
  const defaultMax = roundTo(DEFAULT_CUBEHELIX_PARAMS.saturationMax, ENCODE_PRECISION);
  if (minRounded === maxRounded) {
    if (minRounded !== defaultMin) {
      search.set("saturation", String(minRounded));
    }
  } else {
    if (minRounded !== defaultMin) search.set("saturationMin", String(minRounded));
    if (maxRounded !== defaultMax) search.set("saturationMax", String(maxRounded));
  }
  appendCurveToSearch(search, params.lightnessCurve);
  if (params.reverse !== DEFAULT_CUBEHELIX_PARAMS.reverse) {
    search.set("reverse", params.reverse ? "1" : "0");
  }
}

function readParamsFromSearch(search: URLSearchParams): CubehelixParams {
  const result: CubehelixParams = { ...DEFAULT_CUBEHELIX_PARAMS };
  for (const key of NUMERIC_KEYS) {
    const raw = search.get(key);
    if (raw === null) continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) continue;
    const { min, max } = PARAM_BOUNDS[key];
    result[key] = clamp(num, min, max);
  }
  // Saturation: legacy `?saturation=` sets both ends; explicit
  // `saturationMin` / `saturationMax` keys override.
  const sat = readClampedNum(search, "saturation", SATURATION_BOUNDS);
  if (sat !== null) {
    result.saturationMin = sat;
    result.saturationMax = sat;
  }
  const satMin = readClampedNum(search, "saturationMin", SATURATION_BOUNDS);
  if (satMin !== null) result.saturationMin = satMin;
  const satMax = readClampedNum(search, "saturationMax", SATURATION_BOUNDS);
  if (satMax !== null) result.saturationMax = satMax;

  result.lightnessCurve = readCurveFromSearch(search);
  const rawReverse = search.get("reverse");
  if (rawReverse !== null) {
    result.reverse = rawReverse === "1" || rawReverse === "true";
  }
  normalizeLightnessAxis(result);
  return result;
}

export function encodeParams(params: CubehelixParams): string {
  const search = new URLSearchParams();
  appendParamsToSearch(search, params);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function decodeParams(searchString: string): CubehelixParams {
  return readParamsFromSearch(new URLSearchParams(searchString));
}

export function encodeAppState(state: AppState): string {
  const search = new URLSearchParams();
  appendParamsToSearch(search, state.params);
  if (state.hueAuthoring.mode === "waypoints") {
    // start and rotations are normally derived from the waypoints. They are
    // still emitted (default-omitted as usual) so that a degenerate waypoint
    // config — one the solver can't resolve on decode — falls back to the
    // last-good palette instead of snapping to defaults.
    search.set("hueMode", "waypoints");
    const wp = state.hueAuthoring.waypoints
      .map((w) => `${roundTo(w.t, ENCODE_PRECISION)}:${roundTo(w.hue, ENCODE_PRECISION)}`)
      .join(",");
    search.set("wp", wp);
    if (state.hueAuthoring.winding !== 0) {
      search.set("winding", String(state.hueAuthoring.winding));
    }
  }
  const swatchCount = Math.round(state.swatchCount);
  if (swatchCount !== DEFAULT_SWATCH_COUNT) {
    search.set("swatchCount", String(swatchCount));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function decodeAppState(searchString: string): AppState {
  const search = new URLSearchParams(searchString);
  let params = readParamsFromSearch(search);
  let hueAuthoring: HueAuthoringState = { mode: "freeform" };
  if (search.get("hueMode") === "waypoints") {
    const parsed = parseWaypointsParam(search.get("wp"));
    if (parsed !== null) {
      const winding = parseWindingParam(search.get("winding"));
      const solved = solveHueWaypoints(parsed[0], parsed[1], winding, {
        lightnessCurve: params.lightnessCurve,
        lightnessAxisMin: params.lightnessAxisMin,
        lightnessAxisMax: params.lightnessAxisMax,
        reverse: params.reverse,
      });
      if (solved !== null) {
        params = { ...params, start: solved.start, rotations: solved.rotations };
        hueAuthoring = { mode: "waypoints", waypoints: parsed, winding };
      }
    }
  }
  let swatchCount = DEFAULT_SWATCH_COUNT;
  const rawCount = search.get("swatchCount");
  if (rawCount !== null) {
    const num = Number(rawCount);
    if (Number.isFinite(num)) {
      swatchCount = clamp(Math.round(num), SWATCH_COUNT_BOUNDS.min, SWATCH_COUNT_BOUNDS.max);
    }
  }
  return { params, swatchCount, hueAuthoring };
}

function parseWaypointsParam(raw: string | null): [HueWaypoint, HueWaypoint] | null {
  if (raw === null) return null;
  const parts = raw.split(",");
  if (parts.length !== 2) return null;
  const result: HueWaypoint[] = [];
  for (const part of parts) {
    const [tRaw, hRaw] = part.split(":");
    if (tRaw === undefined || hRaw === undefined) return null;
    const t = Number(tRaw);
    const h = Number(hRaw);
    if (!Number.isFinite(t) || !Number.isFinite(h)) return null;
    result.push({
      t: clamp(t, 0, 1),
      hue: mod(h, 1),
    });
  }
  return [result[0]!, result[1]!];
}

function parseWindingParam(raw: string | null): number {
  if (raw === null) return 0;
  const num = Number(raw);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num);
}
