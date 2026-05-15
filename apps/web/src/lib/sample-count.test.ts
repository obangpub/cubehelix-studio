import { describe, expect, test } from "vitest";
import { effectiveSampleCount, MAX_SAMPLES, MIN_SAMPLES } from "./sample-count";

describe("effectiveSampleCount", () => {
  test("returns the override when provided", () => {
    expect(effectiveSampleCount(1000, 64)).toBe(64);
    expect(effectiveSampleCount(0, 0)).toBe(0);
  });

  test("returns MIN_SAMPLES for low rotation magnitudes", () => {
    expect(effectiveSampleCount(0)).toBe(MIN_SAMPLES);
    expect(effectiveSampleCount(0.5)).toBe(MIN_SAMPLES);
    expect(effectiveSampleCount(-0.99)).toBe(MIN_SAMPLES);
  });

  test("scales with rotation magnitude between the floor and ceiling", () => {
    expect(effectiveSampleCount(2)).toBe(192);
    expect(effectiveSampleCount(-3)).toBe(288);
  });

  test("clamps to MAX_SAMPLES so an extreme rotations value can't explode geometry", () => {
    expect(effectiveSampleCount(1e6)).toBe(MAX_SAMPLES);
    expect(effectiveSampleCount(-1e9)).toBe(MAX_SAMPLES);
    expect(effectiveSampleCount(50)).toBeLessThanOrEqual(MAX_SAMPLES);
  });
});
