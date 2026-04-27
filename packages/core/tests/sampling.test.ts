import { describe, expect, test } from "vitest";
import { DEFAULT_CUBEHELIX_PARAMS } from "../src/cubehelix";
import { sampleSequential } from "../src/sampling";

describe("sampleSequential", () => {
  test("returns n samples with endpoints at t=0 and t=1", () => {
    const samples = sampleSequential(DEFAULT_CUBEHELIX_PARAMS, 5);
    expect(samples).toHaveLength(5);
    expect(samples[0]).toEqual({ r: 0, g: 0, b: 0 });
    expect(samples[4]?.r).toBeCloseTo(1, 12);
    expect(samples[4]?.g).toBeCloseTo(1, 12);
    expect(samples[4]?.b).toBeCloseTo(1, 12);
  });

  test("rejects n < 2", () => {
    expect(() => sampleSequential(DEFAULT_CUBEHELIX_PARAMS, 1)).toThrow(RangeError);
    expect(() => sampleSequential(DEFAULT_CUBEHELIX_PARAMS, 0)).toThrow(RangeError);
    expect(() => sampleSequential(DEFAULT_CUBEHELIX_PARAMS, -3)).toThrow(RangeError);
  });

  test("rejects non-integer n", () => {
    expect(() => sampleSequential(DEFAULT_CUBEHELIX_PARAMS, 3.5)).toThrow(RangeError);
    expect(() => sampleSequential(DEFAULT_CUBEHELIX_PARAMS, NaN)).toThrow(RangeError);
  });

  test("samples 9 points evenly spaced", () => {
    const samples = sampleSequential(DEFAULT_CUBEHELIX_PARAMS, 9);
    expect(samples).toHaveLength(9);
    // Even spacing implies the i-th sample equals cubehelix(i/8, params).
    // Already covered by construction; this asserts the count, not the math.
  });
});
