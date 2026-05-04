import { describe, expect, test } from "vitest";
import { cubehelixRaw, wasClamped } from "../src/cubehelix";
import { getPresetById, PRESETS } from "../src/presets";

describe("presets", () => {
  test("each preset has a unique id", () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("each preset id is url-safe (lowercase alphanumeric and hyphens)", () => {
    for (const p of PRESETS) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test("getPresetById returns the matching preset", () => {
    for (const p of PRESETS) {
      expect(getPresetById(p.id)).toEqual(p);
    }
  });

  test("getPresetById returns undefined for unknown ids", () => {
    expect(getPresetById("does-not-exist")).toBeUndefined();
  });

  test.each(PRESETS.map((p) => [p.id, p]))(
    "preset %s stays in gamut at t in {0, 0.25, 0.5, 0.75, 1}",
    (_id, preset) => {
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const rgb = cubehelixRaw(t, preset.params);
        expect(wasClamped(rgb), `preset ${preset.id} clamps at t=${t}`).toBe(false);
      }
    },
  );

  test("includes the Classic default preset", () => {
    const classic = getPresetById("classic");
    expect(classic).toBeDefined();
    expect(classic?.mode).toBe("sequential");
  });
});
