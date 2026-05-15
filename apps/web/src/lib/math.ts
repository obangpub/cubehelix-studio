/**
 * Generic numeric helpers shared across the web app. These are deliberately
 * not in @cubehelix-studio/core: core's surface is reserved for the cubehelix
 * model itself, and these are plain utilities with no helix semantics.
 */

/** Wrap `value` into the half-open range [0, period). */
export function mod(value: number, period: number): number {
  return ((value % period) + period) % period;
}

/** Clamp `value` to the closed range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Clamp `value` to [0, 1]. */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
