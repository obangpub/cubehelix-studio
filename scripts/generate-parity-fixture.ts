import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cubehelix, DEFAULT_CUBEHELIX_PARAMS } from "../packages/core/src/cubehelix";
import type { CubehelixParams, LightnessCurve } from "../packages/core/src/types";

const STARTS = [0.0, 0.5, 1.0, 2.5];
const ROTATIONS = [-2.0, -1.5, 0.0, 1.5];
const SATURATIONS = [0.5, 1.0, 1.5];
const GAMMAS = [0.7, 1.0, 1.4];
const LIGHTNESS_RANGES: { lightnessMin: number; lightnessMax: number }[] = [
  { lightnessMin: 0.15, lightnessMax: 0.85 },
  { lightnessMin: 0.0, lightnessMax: 0.6 },
  { lightnessMin: 0.4, lightnessMax: 1.0 },
];
const SIGMOID_PROBES: { steepness: number; midpoint: number }[] = [
  { steepness: 4, midpoint: 0.5 },
  { steepness: 8, midpoint: 0.3 },
  { steepness: 6, midpoint: 0.7 },
  { steepness: 0, midpoint: 0.5 },
];
const BEZIER_PROBES: { p1: [number, number]; p2: [number, number] }[] = [
  { p1: [1 / 3, 1 / 3], p2: [2 / 3, 2 / 3] },
  { p1: [0.4, 0.0], p2: [0.6, 1.0] },
  { p1: [0.25, 0.1], p2: [0.25, 1.0] },
  { p1: [0.5, 0.05], p2: [0.5, 0.95] },
];
const LIGHTNESS_RANGE_PROBE: CubehelixParams = {
  start: 0.5,
  rotations: -1.5,
  saturation: 1.0,
  lightnessCurve: { kind: "power", gamma: 1.0 },
  lightnessMin: 0.0,
  lightnessMax: 1.0,
  reverse: false,
};
const T_COUNT = 21;

interface FixtureEntry {
  params: CubehelixParams;
  samples: { t: number; r: number; g: number; b: number }[];
}

function buildEntry(params: CubehelixParams): FixtureEntry {
  const samples: FixtureEntry["samples"] = [];
  for (let i = 0; i < T_COUNT; i++) {
    const t = i / (T_COUNT - 1);
    const { r, g, b } = cubehelix(t, params);
    samples.push({ t, r, g, b });
  }
  return { params, samples };
}

function powerCurve(gamma: number): LightnessCurve {
  return { kind: "power", gamma };
}

const entries: FixtureEntry[] = [];
for (const start of STARTS) {
  for (const rotations of ROTATIONS) {
    for (const saturation of SATURATIONS) {
      for (const gamma of GAMMAS) {
        entries.push(
          buildEntry({
            ...DEFAULT_CUBEHELIX_PARAMS,
            start,
            rotations,
            saturation,
            lightnessCurve: powerCurve(gamma),
          }),
        );
      }
    }
  }
}
for (const range of LIGHTNESS_RANGES) {
  entries.push(buildEntry({ ...LIGHTNESS_RANGE_PROBE, ...range }));
}
entries.push(buildEntry({ ...LIGHTNESS_RANGE_PROBE, reverse: true }));
entries.push(
  buildEntry({ ...LIGHTNESS_RANGE_PROBE, reverse: true, lightnessMin: 0.2, lightnessMax: 0.8 }),
);
for (const sig of SIGMOID_PROBES) {
  entries.push(
    buildEntry({
      ...LIGHTNESS_RANGE_PROBE,
      lightnessCurve: { kind: "sigmoid", steepness: sig.steepness, midpoint: sig.midpoint },
    }),
  );
}
for (const bez of BEZIER_PROBES) {
  entries.push(
    buildEntry({
      ...LIGHTNESS_RANGE_PROBE,
      lightnessCurve: { kind: "bezier", p1: bez.p1, p2: bez.p2 },
    }),
  );
}

const fixture = {
  version: 5,
  generator: "cubehelix-studio/scripts/generate-parity-fixture.ts",
  parameterGrid: {
    start: STARTS,
    rotations: ROTATIONS,
    saturation: SATURATIONS,
    gamma: GAMMAS,
    lightnessRanges: LIGHTNESS_RANGES,
    sigmoidProbes: SIGMOID_PROBES,
    bezierProbes: BEZIER_PROBES,
    tCount: T_COUNT,
  },
  entries,
};

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "..", "fixtures", "parity.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(fixture, null, 2) + "\n");

console.log(
  `wrote ${entries.length} parameter sets x ${T_COUNT} samples (${entries.length * T_COUNT} total) to ${outPath}`,
);
