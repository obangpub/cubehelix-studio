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

  test("includes every param the palette has, generically", () => {
    const out = serialize(palette, "python");
    for (const key of Object.keys(palette.params)) {
      expect(out).toContain(`${key}=`);
    }
  });

  test("produces six-digit role rgb tuples", () => {
    const out = serialize(palette, "python");
    expect(out).toMatch(/"500": \(\d\.\d{6}, \d\.\d{6}, \d\.\d{6}\)/);
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
