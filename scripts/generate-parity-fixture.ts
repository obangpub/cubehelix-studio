import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cubehelix, DEFAULT_CUBEHELIX_PARAMS } from "../packages/core/src/cubehelix";
import type { CubehelixParams } from "../packages/core/src/types";

const STARTS = [0.0, 0.5, 1.0, 2.5];
const ROTATIONS = [-2.0, -1.5, 0.0, 1.5];
const SATURATIONS = [0.5, 1.0, 1.5];
const GAMMAS = [0.7, 1.0, 1.4];
const LIGHTNESS_RANGES: { lightnessMin: number; lightnessMax: number }[] = [
  { lightnessMin: 0.15, lightnessMax: 0.85 },
  { lightnessMin: 0.0, lightnessMax: 0.6 },
  { lightnessMin: 0.4, lightnessMax: 1.0 },
];
const LIGHTNESS_RANGE_PROBE: CubehelixParams = {
  start: 0.5,
  rotations: -1.5,
  saturation: 1.0,
  gamma: 1.0,
  lightnessMin: 0.0,
  lightnessMax: 1.0,
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
            gamma,
          }),
        );
      }
    }
  }
}
for (const range of LIGHTNESS_RANGES) {
  entries.push(buildEntry({ ...LIGHTNESS_RANGE_PROBE, ...range }));
}

const fixture = {
  version: 3,
  generator: "cubehelix-studio/scripts/generate-parity-fixture.ts",
  parameterGrid: {
    start: STARTS,
    rotations: ROTATIONS,
    saturation: SATURATIONS,
    gamma: GAMMAS,
    lightnessRanges: LIGHTNESS_RANGES,
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
