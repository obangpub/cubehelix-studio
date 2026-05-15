// Tube-sample count for the cube visualization. Kept free of three.js imports
// so it can be unit-tested in isolation.

export const SAMPLES_PER_ROTATION = 96;
export const MIN_SAMPLES = 256;
// Hard ceiling on tube samples. Without it, a large `rotations` (typed or
// pasted into the number input) would queue a TubeGeometry with millions of
// segments and freeze the tab.
export const MAX_SAMPLES = 4096;

export function effectiveSampleCount(rotations: number, override?: number): number {
  if (override != null) return override;
  const absR = Math.abs(rotations);
  if (absR < 1) return MIN_SAMPLES;
  return Math.min(Math.ceil(absR) * SAMPLES_PER_ROTATION, MAX_SAMPLES);
}
