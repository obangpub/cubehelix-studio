import { describe, expect, test } from "vitest";
import { DEFAULT_CUBEHELIX_PARAMS } from "../src/cubehelix";
import { serialize } from "../src/exports";
import { DEFAULT_ROLES, type RolePalette } from "../src/roles";

const palette: RolePalette = {
  params: { ...DEFAULT_CUBEHELIX_PARAMS },
  roles: DEFAULT_ROLES,
};

describe("serialize: css", () => {
  test("produces :root with one custom property per role", () => {
    const out = serialize(palette, "css");
    expect(out.startsWith(":root {")).toBe(true);
    expect(out.trim().endsWith("}")).toBe(true);
    for (const role of DEFAULT_ROLES) {
      expect(out).toContain(`--color-${role.name}:`);
    }
  });

  test("respects custom prefix", () => {
    const out = serialize(palette, "css", { prefix: "lf" });
    expect(out).toContain("--lf-50:");
    expect(out).not.toContain("--color-50:");
  });
});

describe("serialize: tailwind", () => {
  test("uses @theme block", () => {
    const out = serialize(palette, "tailwind");
    expect(out.startsWith("@theme {")).toBe(true);
    expect(out).toContain("--color-500:");
  });
});

describe("serialize: scss", () => {
  test("uses dollar-sign variables", () => {
    const out = serialize(palette, "scss");
    expect(out).toContain("$color-50:");
    expect(out).toContain("$color-900:");
    expect(out).not.toContain(":root");
  });
});

describe("serialize: json", () => {
  test("produces valid JSON with prefixed keys", () => {
    const out = serialize(palette, "json");
    const parsed = JSON.parse(out) as Record<string, string>;
    for (const role of DEFAULT_ROLES) {
      expect(parsed[`color-${role.name}`]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("serialize: python", () => {
  test("includes import line and CubehelixParams construction", () => {
    const out = serialize(palette, "python");
    expect(out).toContain("from cubehelix_studio import");
    expect(out).toContain("params = CubehelixParams(");
    expect(out).toContain("cmap = to_matplotlib_colormap(params");
    expect(out).toContain("roles = {");
  });

  test("converts camelCase param keys to snake_case for Python", () => {
    // Force a camelCase key onto params via cast — guards the serializer's
    // case-conversion behavior without depending on the current shape.
    const camelPalette: RolePalette = {
      params: { ...DEFAULT_CUBEHELIX_PARAMS, lightnessAxisMin: 0.15 } as RolePalette["params"],
      roles: palette.roles,
    };
    const out = serialize(camelPalette, "python");
    expect(out).toContain("lightness_axis_min=0.15");
    expect(out).not.toContain("lightnessAxisMin=");
  });

  test("produces six-digit role rgb tuples", () => {
    const out = serialize(palette, "python");
    expect(out).toMatch(/"500": \(\d\.\d{6}, \d\.\d{6}, \d\.\d{6}\)/);
  });

  test("serializes boolean params using Python literals", () => {
    const reversed: RolePalette = {
      params: { ...DEFAULT_CUBEHELIX_PARAMS, reverse: true },
      roles: palette.roles,
    };
    const out = serialize(reversed, "python");
    expect(out).toContain("reverse=True");
    expect(out).not.toContain("reverse=true");
    expect(out).not.toContain("reverse=1.0");
  });
});

describe("serialize: round-trip name preservation", () => {
  test("custom role names appear in CSS output", () => {
    const custom: RolePalette = {
      params: { ...DEFAULT_CUBEHELIX_PARAMS },
      roles: [
        { name: "background", t: 0.05 },
        { name: "foreground", t: 0.95 },
      ],
    };
    const out = serialize(custom, "css");
    expect(out).toContain("--color-background:");
    expect(out).toContain("--color-foreground:");
  });
});
