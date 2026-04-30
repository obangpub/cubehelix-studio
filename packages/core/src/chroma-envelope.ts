export const DEFAULT_CHROMA_PEAK = 0.5;
export const DEFAULT_CHROMA_WIDTH = 1;
export const DEFAULT_CHROMA_FLOOR = 0;

// Peak amplitude calibration: at (peak=0.5, width=1, floor=0) the chroma
// envelope reduces to f·(1−f)/2 (the original cubehelix envelope). The
// normalized shape peaks at 1, and the original envelope peaks at 0.125,
// so the calibration constant is 0.125.
const PEAK_AMPLITUDE = 0.125;

export interface ChromaEnvelopeParams {
  chromaPeak: number;
  chromaWidth: number;
  chromaFloor: number;
}

// Returns the multiplier of `saturation` used to compute the chroma amplitude:
//   amp(f) = saturation · chromaEnvelope(f, params)
// At defaults this equals f·(1−f)/2.
export function chromaEnvelope(fraction: number, params: ChromaEnvelopeParams): number {
  if (fraction <= 0 || fraction >= 1) return params.chromaFloor * PEAK_AMPLITUDE;
  const { chromaPeak: peak, chromaWidth: width, chromaFloor: floor } = params;
  const total = 2 / width;
  const a = peak * total;
  const b = (1 - peak) * total;
  // Shape peaks at fraction = peak (== a/(a+b)). The normalized shape always
  // peaks at 1, so the floor lifts the entire envelope by `floor` while the
  // remaining (1 − floor) is the normalized shape.
  const shapeAtPeak = Math.pow(peak, a) * Math.pow(1 - peak, b);
  if (shapeAtPeak <= 0 || !Number.isFinite(shapeAtPeak)) {
    // Degenerate (peak at 0 or 1 with zero exponent partner). Treat as floor.
    return floor * PEAK_AMPLITUDE;
  }
  const shape = Math.pow(fraction, a) * Math.pow(1 - fraction, b);
  const normalized = shape / shapeAtPeak;
  const envelope = (1 - floor) * normalized + floor;
  return envelope * PEAK_AMPLITUDE;
}
