import { DEFAULT_CUBEHELIX_PARAMS, type CubehelixParams } from "@cubehelix-studio/core";

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
  rotations: { min: -3, max: 3 },
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

export function encodeParams(params: CubehelixParams): string {
  const search = new URLSearchParams();
  for (const key of KEYS) {
    const rounded = roundTo(params[key], ENCODE_PRECISION);
    const defaultRounded = roundTo(DEFAULT_CUBEHELIX_PARAMS[key], ENCODE_PRECISION);
    if (rounded !== defaultRounded) {
      search.set(key, String(rounded));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function decodeParams(searchString: string): CubehelixParams {
  const search = new URLSearchParams(searchString);
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
