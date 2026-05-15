import { clamp, clamp01 } from "./math";

/**
 * A power-curve mapping between a value in [min, max] and a normalized control
 * position in [0, 1]. An exponent > 1 gives the low end of the range more
 * travel; exponent 1 is a plain linear mapping.
 */
export interface ScaleOptions {
  min: number;
  max: number;
  exponent: number;
  /**
   * When provided and > 0, `positionToValue` rounds its result to this step's
   * decimal precision, matching the precision of the underlying control.
   */
  step?: number;
}

/** Map a value in [min, max] to its position in [0, 1] along the power curve. */
export function valueToPosition(value: number, { min, max, exponent }: ScaleOptions): number {
  const span = max - min;
  if (span <= 0) return 0;
  return Math.pow((clamp(value, min, max) - min) / span, 1 / exponent);
}

/** Map a position in [0, 1] back to a value in [min, max] along the power curve. */
export function positionToValue(
  position: number,
  { min, max, exponent, step }: ScaleOptions,
): number {
  const value = min + (max - min) * Math.pow(clamp01(position), exponent);
  if (step !== undefined && step > 0) {
    const decimals = Math.max(0, Math.ceil(-Math.log10(step)));
    return Number(value.toFixed(decimals));
  }
  return value;
}
