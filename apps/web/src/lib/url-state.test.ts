import { describe, expect, test } from "vitest";
import { DEFAULT_CUBEHELIX_PARAMS, type CubehelixParams } from "@cubehelix-studio/core";
import { decodeParams, encodeParams } from "./url-state";

describe("encodeParams", () => {
  test("default params produce empty querystring", () => {
    expect(encodeParams(DEFAULT_CUBEHELIX_PARAMS)).toBe("");
  });

  test("only non-default params appear in the querystring", () => {
    const qs = encodeParams({ ...DEFAULT_CUBEHELIX_PARAMS, saturation: 1.5 });
    expect(qs).toBe("?saturation=1.5");
  });

  test("multiple non-default params are all included", () => {
    const qs = encodeParams({ start: 1.0, rotations: 0.5, saturation: 1.5, gamma: 0.8 });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.get("start")).toBe("1");
    expect(parsed.get("rotations")).toBe("0.5");
    expect(parsed.get("saturation")).toBe("1.5");
    expect(parsed.get("gamma")).toBe("0.8");
  });

  test("rounds to four decimal places", () => {
    const qs = encodeParams({ ...DEFAULT_CUBEHELIX_PARAMS, gamma: 0.123456789 });
    expect(qs).toBe("?gamma=0.1235");
  });
});

describe("decodeParams", () => {
  test("empty querystring returns defaults", () => {
    expect(decodeParams("")).toEqual(DEFAULT_CUBEHELIX_PARAMS);
  });

  test("missing keys fall back to defaults", () => {
    const decoded = decodeParams("?saturation=1.5");
    expect(decoded.start).toBe(DEFAULT_CUBEHELIX_PARAMS.start);
    expect(decoded.rotations).toBe(DEFAULT_CUBEHELIX_PARAMS.rotations);
    expect(decoded.saturation).toBe(1.5);
    expect(decoded.gamma).toBe(DEFAULT_CUBEHELIX_PARAMS.gamma);
  });

  test("invalid values fall back to defaults", () => {
    const decoded = decodeParams("?start=not-a-number&saturation=NaN");
    expect(decoded.start).toBe(DEFAULT_CUBEHELIX_PARAMS.start);
    expect(decoded.saturation).toBe(DEFAULT_CUBEHELIX_PARAMS.saturation);
  });

  test("out-of-range values are clamped to slider bounds", () => {
    const decoded = decodeParams("?start=999&rotations=-999&saturation=-5&gamma=99");
    expect(decoded.start).toBe(3);
    expect(decoded.rotations).toBe(-3);
    expect(decoded.saturation).toBe(0);
    expect(decoded.gamma).toBe(2);
  });

  test("supports leading question mark or omission", () => {
    expect(decodeParams("?saturation=1.5").saturation).toBe(1.5);
    expect(decodeParams("saturation=1.5").saturation).toBe(1.5);
  });
});

describe("round-trip", () => {
  test("encoded values decode back to themselves", () => {
    const original: CubehelixParams = { start: 1.2, rotations: 0.5, saturation: 1.7, gamma: 0.9 };
    expect(decodeParams(encodeParams(original))).toEqual(original);
  });

  test("default params survive a round trip", () => {
    expect(decodeParams(encodeParams(DEFAULT_CUBEHELIX_PARAMS))).toEqual(DEFAULT_CUBEHELIX_PARAMS);
  });
});
