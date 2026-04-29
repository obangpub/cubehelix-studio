import type { CubehelixParams, RGB } from "./types";

export const DEFAULT_CUBEHELIX_PARAMS: CubehelixParams = {
  start: 0.5,
  rotations: -1.5,
  saturation: 1.0,
  gamma: 1.0,
  lightnessMin: 0.0,
  lightnessMax: 1.0,
};

export function cubehelixRaw(t: number, params: CubehelixParams): RGB {
  const { start, rotations, saturation, gamma, lightnessMin, lightnessMax } = params;
  const invGamma = 1 / gamma;
  const uMin = Math.pow(lightnessMin, invGamma);
  const uMax = Math.pow(lightnessMax, invGamma);
  const u = uMin + (uMax - uMin) * t;
  const fraction = Math.pow(u, gamma);
  const angle = 2 * Math.PI * (start / 3 + rotations * u + 1);
  const amp = (saturation * fraction * (1 - fraction)) / 2;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const r = fraction + amp * (-0.14861 * cosA + 1.78277 * sinA);
  const g = fraction + amp * (-0.29227 * cosA - 0.90649 * sinA);
  const b = fraction + amp * (1.97294 * cosA);
  return { r, g, b };
}

export function cubehelix(t: number, params: CubehelixParams): RGB {
  const { r, g, b } = cubehelixRaw(t, params);
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b) };
}

export function wasClamped(rgb: RGB): boolean {
  return rgb.r < 0 || rgb.r > 1 || rgb.g < 0 || rgb.g > 1 || rgb.b < 0 || rgb.b > 1;
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
