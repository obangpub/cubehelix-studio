import type { RGB } from "./types";

function channelToHex(c: number): string {
  return Math.round(c * 255)
    .toString(16)
    .padStart(2, "0");
}

export function toHex(rgb: RGB): string {
  return `#${channelToHex(rgb.r)}${channelToHex(rgb.g)}${channelToHex(rgb.b)}`;
}

export function toCssRgb(rgb: RGB): string {
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);
  return `rgb(${r} ${g} ${b})`;
}
