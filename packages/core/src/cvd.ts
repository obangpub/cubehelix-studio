import type { RGB } from "./types";

export type PreviewMode = "normal" | "grayscale" | "protanopia" | "deuteranopia" | "tritanopia";

// Machado, Oliveira, Fernandes (2009) "A Physiologically-based Model for
// Simulation of Color Vision Deficiency". Severity 1.0 matrices applied in
// linear-sRGB space.
const PROTANOPIA_MATRIX: readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
] = [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998];

const DEUTERANOPIA_MATRIX: readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
] = [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881];

const TRITANOPIA_MATRIX: readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
] = [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039];

// BT.709 luma coefficients for sRGB.
const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

function srgbToLinear(c: number): number {
  if (c <= 0) return 0;
  if (c >= 1) return 1;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  if (c <= 0) return 0;
  if (c >= 1) return 1;
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function applyMatrixLinear(rgb: RGB, m: readonly number[]): RGB {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  const r2 = m[0]! * r + m[1]! * g + m[2]! * b;
  const g2 = m[3]! * r + m[4]! * g + m[5]! * b;
  const b2 = m[6]! * r + m[7]! * g + m[8]! * b;
  return { r: linearToSrgb(r2), g: linearToSrgb(g2), b: linearToSrgb(b2) };
}

function applyGrayscale(rgb: RGB): RGB {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  const y = LUMA_R * r + LUMA_G * g + LUMA_B * b;
  const out = linearToSrgb(y);
  return { r: out, g: out, b: out };
}

export function applyPreview(rgb: RGB, mode: PreviewMode): RGB {
  switch (mode) {
    case "normal":
      return rgb;
    case "grayscale":
      return applyGrayscale(rgb);
    case "protanopia":
      return applyMatrixLinear(rgb, PROTANOPIA_MATRIX);
    case "deuteranopia":
      return applyMatrixLinear(rgb, DEUTERANOPIA_MATRIX);
    case "tritanopia":
      return applyMatrixLinear(rgb, TRITANOPIA_MATRIX);
  }
}

export const PREVIEW_MODES: readonly PreviewMode[] = [
  "normal",
  "grayscale",
  "protanopia",
  "deuteranopia",
  "tritanopia",
];
