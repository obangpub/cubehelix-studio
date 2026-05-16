import { describe, expect, test } from "vitest";
import { positionToValue, valueToPosition } from "./scale";

describe("positionToValue", () => {
  test("maps the endpoints to min and max", () => {
    expect(positionToValue(0, { min: 2, max: 10, exponent: 1 })).toBe(2);
    expect(positionToValue(1, { min: 2, max: 10, exponent: 1 })).toBe(10);
    expect(positionToValue(0, { min: 0, max: 5, exponent: 3 })).toBe(0);
    expect(positionToValue(1, { min: 0, max: 5, exponent: 3 })).toBe(5);
  });

  test("exponent 1 is a linear mapping", () => {
    expect(positionToValue(0.5, { min: 0, max: 10, exponent: 1 })).toBe(5);
    expect(positionToValue(0.25, { min: 0, max: 8, exponent: 1 })).toBe(2);
  });

  test("exponent > 1 biases travel toward the low end of the range", () => {
    // p = 0.5 at exponent 3 covers 0.5^3 = 0.125 of the range.
    expect(positionToValue(0.5, { min: 0, max: 8, exponent: 3 })).toBeCloseTo(1, 10);
  });

  test("clamps positions outside [0, 1]", () => {
    expect(positionToValue(-0.5, { min: 0, max: 10, exponent: 1 })).toBe(0);
    expect(positionToValue(2, { min: 0, max: 10, exponent: 1 })).toBe(10);
  });

  test("rounds to the step's decimal precision when step is given", () => {
    expect(positionToValue(1 / 3, { min: 0, max: 1, exponent: 1, step: 0.01 })).toBe(0.33);
    expect(positionToValue(1 / 3, { min: 0, max: 1, exponent: 1, step: 0.1 })).toBe(0.3);
  });

  test("does not round when step is omitted", () => {
    expect(positionToValue(1 / 3, { min: 0, max: 1, exponent: 1 })).toBeCloseTo(0.333333, 6);
  });
});

describe("valueToPosition", () => {
  test("maps min and max to 0 and 1", () => {
    expect(valueToPosition(2, { min: 2, max: 10, exponent: 1 })).toBe(0);
    expect(valueToPosition(10, { min: 2, max: 10, exponent: 1 })).toBe(1);
  });

  test("clamps values outside [min, max]", () => {
    expect(valueToPosition(-5, { min: 0, max: 10, exponent: 2 })).toBe(0);
    expect(valueToPosition(99, { min: 0, max: 10, exponent: 2 })).toBe(1);
  });

  test("returns 0 for a degenerate zero-span range", () => {
    expect(valueToPosition(5, { min: 5, max: 5, exponent: 1 })).toBe(0);
  });
});

describe("round-trip", () => {
  test("positionToValue and valueToPosition invert each other across exponents", () => {
    for (const exponent of [1, 2, 3]) {
      const opts = { min: 0, max: 4.5, exponent };
      for (const p of [0, 0.1, 0.37, 0.5, 0.8, 1]) {
        const v = positionToValue(p, opts);
        expect(valueToPosition(v, opts)).toBeCloseTo(p, 10);
      }
    }
  });
});
