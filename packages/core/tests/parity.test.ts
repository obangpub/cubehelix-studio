import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { cubehelix } from "../src/cubehelix";
import type { CubehelixParams } from "../src/types";

interface ParityFixture {
  version: number;
  entries: {
    params: CubehelixParams;
    samples: { t: number; r: number; g: number; b: number }[];
  }[];
}

const FIXTURE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../fixtures/parity.json",
);

const fixture: ParityFixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
const TOLERANCE = 1e-12;

describe("parity fixture", () => {
  test(`@cubehelix-studio/core matches ${fixture.entries.length} entries within ${TOLERANCE} per channel`, () => {
    for (const entry of fixture.entries) {
      for (const s of entry.samples) {
        const out = cubehelix(s.t, entry.params);
        const dr = Math.abs(out.r - s.r);
        const dg = Math.abs(out.g - s.g);
        const db = Math.abs(out.b - s.b);
        if (dr >= TOLERANCE || dg >= TOLERANCE || db >= TOLERANCE) {
          throw new Error(
            `parity drift at params=${JSON.stringify(entry.params)} t=${s.t}: dr=${dr} dg=${dg} db=${db}`,
          );
        }
      }
    }
    expect(fixture.entries.length).toBeGreaterThan(0);
  });
});
