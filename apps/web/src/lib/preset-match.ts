import type { CubehelixParams, LightnessCurve } from "@cubehelix-studio/core";

export function lightnessCurveEqual(a: LightnessCurve, b: LightnessCurve): boolean {
  if (a.kind === "power" && b.kind === "power") return a.gamma === b.gamma;
  if (a.kind === "sigmoid" && b.kind === "sigmoid")
    return a.steepness === b.steepness && a.midpoint === b.midpoint;
  if (a.kind === "bezier" && b.kind === "bezier")
    return a.p1[0] === b.p1[0] && a.p1[1] === b.p1[1] && a.p2[0] === b.p2[0] && a.p2[1] === b.p2[1];
  return false;
}

// Preset values are short decimals that round-trip through the URL exactly,
// so exact equality is enough to tell whether the current palette IS a preset.
export function paramsEqual(a: CubehelixParams, b: CubehelixParams): boolean {
  return (
    a.start === b.start &&
    a.rotations === b.rotations &&
    a.saturationMin === b.saturationMin &&
    a.saturationMax === b.saturationMax &&
    a.lightnessAxisMin === b.lightnessAxisMin &&
    a.lightnessAxisMax === b.lightnessAxisMax &&
    a.chromaPeak === b.chromaPeak &&
    a.chromaWidth === b.chromaWidth &&
    a.chromaFloor === b.chromaFloor &&
    a.reverse === b.reverse &&
    lightnessCurveEqual(a.lightnessCurve, b.lightnessCurve)
  );
}
