import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cubehelix, DEFAULT_CUBEHELIX_PARAMS } from "../packages/core/src/cubehelix";
import type { CubehelixParams, LightnessCurve } from "../packages/core/src/types";

const STARTS = [0.0, 0.5, 1.0, 2.5];
const ROTATIONS = [-2.0, -1.5, 0.0, 1.5];
const SATURATIONS = [0.5, 1.0, 1.5];
const GAMMAS = [0.7, 1.0, 1.4];
const LIGHTNESS_RANGES: { lightnessAxisMin: number; lightnessAxisMax: number }[] = [
  { lightnessAxisMin: 0.15, lightnessAxisMax: 0.85 },
  { lightnessAxisMin: 0.0, lightnessAxisMax: 0.6 },
  { lightnessAxisMin: 0.4, lightnessAxisMax: 1.0 },
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
const CHROMA_PROBES: { chromaPeak: number; chromaWidth: number; chromaFloor: number }[] = [
  { chromaPeak: 0.3, chromaWidth: 1.0, chromaFloor: 0.0 },
  { chromaPeak: 0.7, chromaWidth: 1.0, chromaFloor: 0.0 },
  { chromaPeak: 0.5, chromaWidth: 0.5, chromaFloor: 0.0 },
  { chromaPeak: 0.5, chromaWidth: 2.0, chromaFloor: 0.0 },
  { chromaPeak: 0.5, chromaWidth: 1.0, chromaFloor: 0.25 },
  { chromaPeak: 0.3, chromaWidth: 0.7, chromaFloor: 0.15 },
];
const SATURATION_PROBES: { saturationMin: number; saturationMax: number }[] = [
  { saturationMin: 0.0, saturationMax: 1.5 },
  { saturationMin: 1.5, saturationMax: 0.0 },
  { saturationMin: 0.5, saturationMax: 1.5 },
];
const LIGHTNESS_RANGE_PROBE: CubehelixParams = {
  start: 0.5,
  rotations: -1.5,
  saturationMin: 1.0,
  saturationMax: 1.0,
  lightnessCurve: { kind: "power", gamma: 1.0 },
  lightnessAxisMin: 0.0,
  lightnessAxisMax: 1.0,
  chromaPeak: 0.5,
  chromaWidth: 1.0,
  chromaFloor: 0.0,
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
            saturationMin: saturation,
            saturationMax: saturation,
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
  buildEntry({
    ...LIGHTNESS_RANGE_PROBE,
    reverse: true,
    lightnessAxisMin: 0.2,
    lightnessAxisMax: 0.8,
  }),
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
for (const chroma of CHROMA_PROBES) {
  entries.push(
    buildEntry({
      ...LIGHTNESS_RANGE_PROBE,
      ...chroma,
    }),
  );
}
for (const sat of SATURATION_PROBES) {
  entries.push(
    buildEntry({
      ...LIGHTNESS_RANGE_PROBE,
      ...sat,
    }),
  );
}

const fixture = {
  version: 9,
  generator: "cubehelix-studio/scripts/generate-parity-fixture.ts",
  parameterGrid: {
    start: STARTS,
    rotations: ROTATIONS,
    saturation: SATURATIONS,
    gamma: GAMMAS,
    lightnessRanges: LIGHTNESS_RANGES,
    sigmoidProbes: SIGMOID_PROBES,
    bezierProbes: BEZIER_PROBES,
    chromaProbes: CHROMA_PROBES,
    saturationProbes: SATURATION_PROBES,
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
