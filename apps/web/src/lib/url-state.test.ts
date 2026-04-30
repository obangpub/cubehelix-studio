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
      lightnessCurve: { kind: "power", gamma: 0.8 },
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
      lightnessAxisMin: 0.15,
      lightnessAxisMax: 0.85,
    });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.get("lightnessAxisMin")).toBe("0.15");
    expect(parsed.get("lightnessAxisMax")).toBe("0.85");
  });

  test("reverse=true is encoded as 1; default false is omitted", () => {
    expect(encodeParams({ ...DEFAULT_CUBEHELIX_PARAMS, reverse: true })).toBe("?reverse=1");
    expect(encodeParams(DEFAULT_CUBEHELIX_PARAMS)).toBe("");
  });

  test("rounds to four decimal places", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "power", gamma: 0.123456789 },
    });
    expect(qs).toBe("?gamma=0.1235");
  });

  test("default power curve omits both lightnessCurve and gamma", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "power", gamma: 1 },
    });
    expect(qs).toBe("");
  });

  test("non-default power gamma is encoded without lightnessCurve key", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "power", gamma: 1.5 },
    });
    expect(qs).toBe("?gamma=1.5");
  });

  test("sigmoid curve emits lightnessCurve and only non-default sigmoid params", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "sigmoid", steepness: 4, midpoint: 0.5 },
    });
    expect(qs).toBe("?lightnessCurve=sigmoid");
  });

  test("non-default sigmoid params appear", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "sigmoid", steepness: 6, midpoint: 0.3 },
    });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.get("lightnessCurve")).toBe("sigmoid");
    expect(parsed.get("sigmoidSteepness")).toBe("6");
    expect(parsed.get("sigmoidMidpoint")).toBe("0.3");
  });

  test("default bezier curve emits only the lightnessCurve key", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "bezier", p1: [1 / 3, 1 / 3], p2: [2 / 3, 2 / 3] },
    });
    expect(qs).toBe("?lightnessCurve=bezier");
  });

  test("non-default bezier handles are encoded as separate x/y components", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "bezier", p1: [0.4, 0.2], p2: [0.6, 0.8] },
    });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.get("lightnessCurve")).toBe("bezier");
    expect(parsed.get("bezier1x")).toBe("0.4");
    expect(parsed.get("bezier1y")).toBe("0.2");
    expect(parsed.get("bezier2x")).toBe("0.6");
    expect(parsed.get("bezier2y")).toBe("0.8");
  });

  test("sigmoid params are not emitted when curve is power", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "power", gamma: 1.4 },
    });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.has("sigmoidSteepness")).toBe(false);
    expect(parsed.has("bezier1x")).toBe(false);
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
    expect(decoded.lightnessCurve).toEqual({ kind: "power", gamma: 1 });
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
    expect(decoded.lightnessCurve).toEqual({ kind: "power", gamma: 2 });
  });

  test("rotations is uncapped on decode", () => {
    expect(decodeParams("?rotations=-999").rotations).toBe(-999);
    expect(decodeParams("?rotations=42.5").rotations).toBe(42.5);
  });

  test("saturation is uncapped above on decode but floored at 0", () => {
    expect(decodeParams("?saturation=42").saturation).toBe(42);
    expect(decodeParams("?saturation=-5").saturation).toBe(0);
  });

  test("lightness range is clamped to [0, 1]", () => {
    const decoded = decodeParams("?lightnessAxisMin=-0.5&lightnessAxisMax=2");
    expect(decoded.lightnessAxisMin).toBe(0);
    expect(decoded.lightnessAxisMax).toBe(1);
  });

  test("inverted lightness range is normalized to ascending order", () => {
    const decoded = decodeParams("?lightnessAxisMin=0.8&lightnessAxisMax=0.3");
    expect(decoded.lightnessAxisMin).toBe(0.3);
    expect(decoded.lightnessAxisMax).toBe(0.8);
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

  test("legacy gamma-only URLs decode as power curve", () => {
    const decoded = decodeParams("?gamma=1.5");
    expect(decoded.lightnessCurve).toEqual({ kind: "power", gamma: 1.5 });
  });

  test("sigmoid curve decodes with given steepness and midpoint", () => {
    const decoded = decodeParams("?lightnessCurve=sigmoid&sigmoidSteepness=6&sigmoidMidpoint=0.3");
    expect(decoded.lightnessCurve).toEqual({ kind: "sigmoid", steepness: 6, midpoint: 0.3 });
  });

  test("sigmoid curve falls back to defaults when its params are missing", () => {
    const decoded = decodeParams("?lightnessCurve=sigmoid");
    expect(decoded.lightnessCurve).toEqual({ kind: "sigmoid", steepness: 4, midpoint: 0.5 });
  });

  test("bezier curve decodes with given handles", () => {
    const decoded = decodeParams(
      "?lightnessCurve=bezier&bezier1x=0.4&bezier1y=0.2&bezier2x=0.6&bezier2y=0.8",
    );
    expect(decoded.lightnessCurve).toEqual({
      kind: "bezier",
      p1: [0.4, 0.2],
      p2: [0.6, 0.8],
    });
  });

  test("bezier handle components are clamped to [0, 1]", () => {
    const decoded = decodeParams(
      "?lightnessCurve=bezier&bezier1x=-1&bezier1y=2&bezier2x=99&bezier2y=-99",
    );
    expect(decoded.lightnessCurve).toEqual({
      kind: "bezier",
      p1: [0, 1],
      p2: [1, 0],
    });
  });

  test("unknown lightnessCurve value falls back to power", () => {
    const decoded = decodeParams("?lightnessCurve=cosmic");
    expect(decoded.lightnessCurve).toEqual({ kind: "power", gamma: 1 });
  });

  test("bezier params are ignored when curve kind is power", () => {
    const decoded = decodeParams("?bezier1x=0.4&gamma=1.3");
    expect(decoded.lightnessCurve).toEqual({ kind: "power", gamma: 1.3 });
  });
});

describe("round-trip", () => {
  test("encoded values decode back to themselves", () => {
    const original: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 1.2,
      rotations: 0.5,
      saturation: 1.7,
      lightnessCurve: { kind: "power", gamma: 0.9 },
      lightnessAxisMin: 0.1,
      lightnessAxisMax: 0.9,
      reverse: true,
    };
    expect(decodeParams(encodeParams(original))).toEqual(original);
  });

  test("default params survive a round trip", () => {
    expect(decodeParams(encodeParams(DEFAULT_CUBEHELIX_PARAMS))).toEqual(DEFAULT_CUBEHELIX_PARAMS);
  });

  test("sigmoid curve round-trips", () => {
    const original: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "sigmoid", steepness: 6, midpoint: 0.3 },
    };
    expect(decodeParams(encodeParams(original))).toEqual(original);
  });

  test("bezier curve round-trips", () => {
    const original: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      lightnessCurve: { kind: "bezier", p1: [0.4, 0.2], p2: [0.6, 0.8] },
    };
    expect(decodeParams(encodeParams(original))).toEqual(original);
  });

  test("chroma envelope params round-trip", () => {
    const original: CubehelixParams = {
      ...DEFAULT_CUBEHELIX_PARAMS,
      chromaPeak: 0.3,
      chromaWidth: 1.5,
      chromaFloor: 0.2,
    };
    expect(decodeParams(encodeParams(original))).toEqual(original);
  });
});

describe("chroma envelope params", () => {
  test("non-default chromaPeak is encoded", () => {
    const qs = encodeParams({ ...DEFAULT_CUBEHELIX_PARAMS, chromaPeak: 0.3 });
    expect(qs).toBe("?chromaPeak=0.3");
  });

  test("non-default chromaWidth and chromaFloor are encoded", () => {
    const qs = encodeParams({
      ...DEFAULT_CUBEHELIX_PARAMS,
      chromaWidth: 1.5,
      chromaFloor: 0.25,
    });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.get("chromaWidth")).toBe("1.5");
    expect(parsed.get("chromaFloor")).toBe("0.25");
  });

  test("chromaPeak and chromaFloor are clamped to [0, 1] on decode", () => {
    const decoded = decodeParams("?chromaPeak=2&chromaFloor=-0.5");
    expect(decoded.chromaPeak).toBe(1);
    expect(decoded.chromaFloor).toBe(0);
  });

  test("chromaWidth is clamped to its safe range on decode", () => {
    const decoded = decodeParams("?chromaWidth=99");
    expect(decoded.chromaWidth).toBeLessThanOrEqual(5);
    expect(decoded.chromaWidth).toBeGreaterThan(0);
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
        ...DEFAULT_CUBEHELIX_PARAMS,
        start: 1.2,
        rotations: 0.5,
        saturation: 1.7,
        lightnessCurve: { kind: "power", gamma: 0.9 },
        lightnessAxisMin: 0.1,
        lightnessAxisMax: 0.9,
        reverse: true,
      } satisfies CubehelixParams,
      swatchCount: 14,
    };
    expect(decodeAppState(encodeAppState(original))).toEqual(original);
  });
});
