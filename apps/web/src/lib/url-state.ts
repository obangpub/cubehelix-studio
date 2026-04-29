import { DEFAULT_CUBEHELIX_PARAMS, type CubehelixParams } from "@cubehelix-studio/core";

export interface AppState {
  params: CubehelixParams;
  swatchCount: number;
}

export const DEFAULT_SWATCH_COUNT = 9;
export const SWATCH_COUNT_BOUNDS = { min: 2, max: 20 } as const;

export const DEFAULT_APP_STATE: AppState = {
  params: DEFAULT_CUBEHELIX_PARAMS,
  swatchCount: DEFAULT_SWATCH_COUNT,
};

const KEYS = [
  "start",
  "rotations",
  "saturation",
  "gamma",
  "lightnessMin",
  "lightnessMax",
] as const satisfies readonly (keyof CubehelixParams)[];

const PARAM_BOUNDS: Record<keyof CubehelixParams, { min: number; max: number }> = {
  start: { min: 0, max: 3 },
  rotations: { min: -Infinity, max: Infinity },
  saturation: { min: 0, max: 2 },
  gamma: { min: 0.5, max: 2 },
  lightnessMin: { min: 0, max: 1 },
  lightnessMax: { min: 0, max: 1 },
};

const ENCODE_PRECISION = 4;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function appendParamsToSearch(search: URLSearchParams, params: CubehelixParams): void {
  for (const key of KEYS) {
    const rounded = roundTo(params[key], ENCODE_PRECISION);
    const defaultRounded = roundTo(DEFAULT_CUBEHELIX_PARAMS[key], ENCODE_PRECISION);
    if (rounded !== defaultRounded) {
      search.set(key, String(rounded));
    }
  }
}

function readParamsFromSearch(search: URLSearchParams): CubehelixParams {
  const result: CubehelixParams = { ...DEFAULT_CUBEHELIX_PARAMS };
  for (const key of KEYS) {
    const raw = search.get(key);
    if (raw === null) continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) continue;
    const { min, max } = PARAM_BOUNDS[key];
    result[key] = clamp(num, min, max);
  }
  if (result.lightnessMin > result.lightnessMax) {
    const lo = result.lightnessMax;
    const hi = result.lightnessMin;
    result.lightnessMin = lo;
    result.lightnessMax = hi;
  }
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
  const swatchCount = Math.round(state.swatchCount);
  if (swatchCount !== DEFAULT_SWATCH_COUNT) {
    search.set("swatchCount", String(swatchCount));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function decodeAppState(searchString: string): AppState {
  const search = new URLSearchParams(searchString);
  const params = readParamsFromSearch(search);
  let swatchCount = DEFAULT_SWATCH_COUNT;
  const rawCount = search.get("swatchCount");
  if (rawCount !== null) {
    const num = Number(rawCount);
    if (Number.isFinite(num)) {
      swatchCount = clamp(Math.round(num), SWATCH_COUNT_BOUNDS.min, SWATCH_COUNT_BOUNDS.max);
    }
  }
  return { params, swatchCount };
}
