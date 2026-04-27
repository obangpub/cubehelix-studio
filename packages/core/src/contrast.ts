import type { RGB } from "./types";

function linearize(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: RGB): number {
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = la >= lb ? la : lb;
  const lo = la >= lb ? lb : la;
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: RGB = { r: 1, g: 1, b: 1 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

export function pickTextColor(bg: RGB, candidates: readonly RGB[] = [WHITE, BLACK]): RGB {
  const [first, ...rest] = candidates;
  if (first === undefined) {
    throw new RangeError("pickTextColor requires at least one candidate");
  }
  let best = first;
  let bestRatio = contrastRatio(bg, first);
  for (const candidate of rest) {
    const ratio = contrastRatio(bg, candidate);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }
  return best;
}
