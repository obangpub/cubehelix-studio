import type { CubehelixParams, RGB } from "./types";

export const DEFAULT_CUBEHELIX_PARAMS: CubehelixParams = {
  start: 0.5,
  rotations: -1.5,
  saturation: 1.0,
  gamma: 1.0,
  lightnessMin: 0.0,
  lightnessMax: 1.0,
  reverse: false,
};

export function cubehelixRaw(t: number, params: CubehelixParams): RGB {
  const { start, rotations, saturation, gamma, lightnessMin, lightnessMax, reverse } = params;
  const tEff = reverse ? 1 - t : t;
  const invGamma = 1 / gamma;
  const uMin = Math.pow(lightnessMin, invGamma);
  const uMax = Math.pow(lightnessMax, invGamma);
  const u = uMin + (uMax - uMin) * tEff;
  const fraction = Math.pow(u, gamma);
  // Angle is parameterized by the user's visible position (tEff), so `rotations`
  // means "turns over the visible palette" regardless of lightness range.
  const angle = 2 * Math.PI * (start / 3 + rotations * tEff + 1);
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

const SATURATION_CAP_SAMPLES = 256;
const SATURATION_CAP_PERCENTILE = 0.95;

export function saturationCap(params: CubehelixParams): number {
  const { start, rotations, gamma, lightnessMin, lightnessMax } = params;
  const invGamma = 1 / gamma;
  const uMin = Math.pow(lightnessMin, invGamma);
  const uMax = Math.pow(lightnessMax, invGamma);
  const exitSaturations: number[] = [];
  for (let i = 0; i <= SATURATION_CAP_SAMPLES; i++) {
    const tEff = i / SATURATION_CAP_SAMPLES;
    const u = uMin + (uMax - uMin) * tEff;
    const fraction = Math.pow(u, gamma);
    const envelope = (fraction * (1 - fraction)) / 2;
    if (envelope === 0) continue;
    const angle = 2 * Math.PI * (start / 3 + rotations * tEff + 1);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const dirs = [
      -0.14861 * cosA + 1.78277 * sinA,
      -0.29227 * cosA - 0.90649 * sinA,
      1.97294 * cosA,
    ];
    let sExit = Infinity;
    for (const dir of dirs) {
      const k = envelope * dir;
      if (k === 0) continue;
      const s = k > 0 ? (1 - fraction) / k : -fraction / k;
      if (s < sExit) sExit = s;
    }
    if (Number.isFinite(sExit) && sExit > 0) exitSaturations.push(sExit);
  }
  if (exitSaturations.length === 0) return 0;
  exitSaturations.sort((a, b) => a - b);
  const idx = Math.min(
    exitSaturations.length - 1,
    Math.floor(exitSaturations.length * SATURATION_CAP_PERCENTILE),
  );
  return exitSaturations[idx]!;
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
