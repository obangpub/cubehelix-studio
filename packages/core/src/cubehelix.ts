import type { CubehelixParams, RGB } from "./types";

export const DEFAULT_CUBEHELIX_PARAMS: CubehelixParams = {
  start: 0.5,
  rotations: -1.5,
  saturation: 1.0,
  gamma: 1.0,
};

export function cubehelixRaw(t: number, params: CubehelixParams): RGB {
  const { start, rotations, saturation, gamma } = params;
  const fraction = Math.pow(t, gamma);
  const angle = 2 * Math.PI * (start / 3 + rotations * t + 1);
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

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
