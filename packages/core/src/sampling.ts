import { cubehelix } from "./cubehelix";
import type { CubehelixParams, RGB } from "./types";

export function sampleSequential(params: CubehelixParams, n: number): RGB[] {
  if (!Number.isInteger(n) || n < 2) {
    throw new RangeError(`sampleSequential requires n >= 2 integer; got ${n}`);
  }
  const out: RGB[] = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = cubehelix(i / (n - 1), params);
  }
  return out;
}
