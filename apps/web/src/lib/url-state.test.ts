import { describe, expect, test } from "vitest";
import { DEFAULT_CUBEHELIX_PARAMS, type CubehelixParams } from "@cubehelix-studio/core";
import {
  DEFAULT_APP_STATE,
  DEFAULT_SWATCH_COUNT,
  decodeAppState,
  decodeParams,
  encodeAppState,
  encodeParams,
} from "./url-state";

describe("encodeParams", () => {
  test("default params produce empty querystring", () => {
    expect(encodeParams(DEFAULT_CUBEHELIX_PARAMS)).toBe("");
  });

  test("only non-default params appear in the querystring", () => {
    const qs = encodeParams({ ...DEFAULT_CUBEHELIX_PARAMS, saturation: 1.5 });
    expect(qs).toBe("?saturation=1.5");
  });

  test("multiple non-default params are all included", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 1.0,
      rotations: 0.5,
      saturation: 1.5,
      gamma: 0.8,
    });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.get("start")).toBe("1");
    expect(parsed.get("rotations")).toBe("0.5");
    expect(parsed.get("saturation")).toBe("1.5");
    expect(parsed.get("gamma")).toBe("0.8");
  });

  test("non-default lightness range is encoded", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessMin: 0.15,
      lightnessMax: 0.85,
    });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.get("lightnessMin")).toBe("0.15");
    expect(parsed.get("lightnessMax")).toBe("0.85");
  });

  test("reverse=true is encoded as 1; default false is omitted", () => {
    expect(encodeParams({ ...DEFAULT_CUBEHELIX_PARAMS, reverse: true })).toBe("?reverse=1");
    expect(encodeParams(DEFAULT_CUBEHELIX_PARAMS)).toBe("");
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
    const decoded = decodeParams("?start=999&saturation=-5&gamma=99");
    expect(decoded.start).toBe(3);
    expect(decoded.saturation).toBe(0);
    expect(decoded.gamma).toBe(2);
  });

  test("rotations is uncapped on decode", () => {
    expect(decodeParams("?rotations=-999").rotations).toBe(-999);
    expect(decodeParams("?rotations=42.5").rotations).toBe(42.5);
  });

  test("lightness range is clamped to [0, 1]", () => {
    const decoded = decodeParams("?lightnessMin=-0.5&lightnessMax=2");
    expect(decoded.lightnessMin).toBe(0);
    expect(decoded.lightnessMax).toBe(1);
  });

  test("inverted lightness range is normalized to ascending order", () => {
    const decoded = decodeParams("?lightnessMin=0.8&lightnessMax=0.3");
    expect(decoded.lightnessMin).toBe(0.3);
    expect(decoded.lightnessMax).toBe(0.8);
  });

  test("reverse decodes from 1 or true; absence yields default", () => {
    expect(decodeParams("?reverse=1").reverse).toBe(true);
    expect(decodeParams("?reverse=true").reverse).toBe(true);
    expect(decodeParams("?reverse=0").reverse).toBe(false);
    expect(decodeParams("").reverse).toBe(DEFAULT_CUBEHELIX_PARAMS.reverse);
  });

  test("supports leading question mark or omission", () => {
    expect(decodeParams("?saturation=1.5").saturation).toBe(1.5);
    expect(decodeParams("saturation=1.5").saturation).toBe(1.5);
  });
});

describe("round-trip", () => {
  test("encoded values decode back to themselves", () => {
    const original: CubehelixParams = {
      start: 1.2,
      rotations: 0.5,
      saturation: 1.7,
      gamma: 0.9,
      lightnessMin: 0.1,
      lightnessMax: 0.9,
      reverse: true,
    };
    expect(decodeParams(encodeParams(original))).toEqual(original);
  });

  test("default params survive a round trip", () => {
    expect(decodeParams(encodeParams(DEFAULT_CUBEHELIX_PARAMS))).toEqual(DEFAULT_CUBEHELIX_PARAMS);
  });
});

describe("encodeAppState / decodeAppState", () => {
  test("default state produces empty querystring", () => {
    expect(encodeAppState(DEFAULT_APP_STATE)).toBe("");
  });

  test("default swatchCount is omitted from the querystring", () => {
    const qs = encodeAppState({
      params: { ...DEFAULT_CUBEHELIX_PARAMS, saturation: 1.5 },
      swatchCount: DEFAULT_SWATCH_COUNT,
    });
    expect(qs).toBe("?saturation=1.5");
  });

  test("non-default swatchCount is encoded", () => {
    const qs = encodeAppState({ params: DEFAULT_CUBEHELIX_PARAMS, swatchCount: 12 });
    expect(qs).toBe("?swatchCount=12");
  });

  test("missing swatchCount falls back to default", () => {
    const decoded = decodeAppState("?saturation=1.5");
    expect(decoded.swatchCount).toBe(DEFAULT_SWATCH_COUNT);
    expect(decoded.params.saturation).toBe(1.5);
  });

  test("swatchCount is clamped and rounded", () => {
    expect(decodeAppState("?swatchCount=999").swatchCount).toBe(20);
    expect(decodeAppState("?swatchCount=0").swatchCount).toBe(2);
    expect(decodeAppState("?swatchCount=7.6").swatchCount).toBe(8);
  });

  test("invalid swatchCount falls back to default", () => {
    expect(decodeAppState("?swatchCount=foo").swatchCount).toBe(DEFAULT_SWATCH_COUNT);
  });

  test("encoded state round-trips", () => {
    const original = {
      params: {
        start: 1.2,
        rotations: 0.5,
        saturation: 1.7,
        gamma: 0.9,
        lightnessMin: 0.1,
        lightnessMax: 0.9,
        reverse: true,
      } satisfies CubehelixParams,
      swatchCount: 14,
    };
    expect(decodeAppState(encodeAppState(original))).toEqual(original);
  });
});
