import { cubehelixRaw, wasClamped } from "../packages/core/src/cubehelix";
import { PRESETS } from "../packages/core/src/presets";
import type { CubehelixParams } from "../packages/core/src/types";

function maxSafeSaturation(base: CubehelixParams): number {
  // Binary-search the largest saturation (applied uniformly) at which no
  // sample over t in [0, 1] is out of gamut.
  let lo = 0;
  let hi = 5;
  for (let iter = 0; iter < 30; iter++) {
    const mid = (lo + hi) / 2;
    const probe: CubehelixParams = {
      ...base,
      saturationMin: mid,
      saturationMax: mid,
    };
    let clamps = false;
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      if (wasClamped(cubehelixRaw(t, probe))) {
        clamps = true;
        break;
      }
    }
    if (clamps) hi = mid;
    else lo = mid;
  }
  return lo;
}

for (const p of PRESETS) {
  const safe = maxSafeSaturation(p.params);
  const outOfGamut: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    if (wasClamped(cubehelixRaw(t, p.params))) {
      outOfGamut.push(t.toFixed(3));
    }
  }
  console.log(
    p.id.padEnd(10),
    "current sat=",
    p.params.saturationMin.toFixed(2),
    "max safe sat=",
    safe.toFixed(3),
    "current OOG count:",
    outOfGamut.length,
  );
}
