import { describe, expect, test } from "vitest";
import { DEFAULT_CUBEHELIX_PARAMS, PRESETS, type CubehelixParams } from "@cubehelix-studio/core";
import { paramsEqual } from "./preset-match";

/** Change exactly one field of `base` so it should no longer compare equal. */
function perturbField(base: CubehelixParams, key: keyof CubehelixParams): CubehelixParams {
  if (key === "lightnessCurve") {
    return { ...base, lightnessCurve: { kind: "sigmoid", steepness: 6, midpoint: 0.5 } };
  }
  const value = base[key];
  const changed = typeof value === "boolean" ? !value : (value as number) + 0.123;
  return { ...base, [key]: changed } as CubehelixParams;
}

describe("paramsEqual", () => {
  test("a params object equals an identical copy", () => {
    expect(paramsEqual(DEFAULT_CUBEHELIX_PARAMS, { ...DEFAULT_CUBEHELIX_PARAMS })).toBe(true);
  });

  test("every built-in preset matches its own params", () => {
    for (const preset of PRESETS) {
      expect(paramsEqual(preset.params, { ...preset.params })).toBe(true);
    }
  });

  test("distinct presets do not match each other", () => {
    for (let i = 0; i < PRESETS.length; i++) {
      for (let j = i + 1; j < PRESETS.length; j++) {
        expect(paramsEqual(PRESETS[i]!.params, PRESETS[j]!.params)).toBe(false);
      }
    }
  });

  test("perturbing any single field breaks equality (exhaustiveness tripwire)", () => {
    // Iterating Object.keys means a newly added CubehelixParams field is
    // covered automatically: if paramsEqual is not updated to compare it, the
    // perturbation for that field will not break equality and this test fails.
    const base = DEFAULT_CUBEHELIX_PARAMS;
    for (const key of Object.keys(base) as (keyof CubehelixParams)[]) {
      expect(paramsEqual(base, perturbField(base, key))).toBe(false);
    }
  });
});
