import { describe, expect, test } from "vitest";
import { DEFAULT_CUBEHELIX_PARAMS } from "../src/cubehelix";
import { contrastMatrix, DEFAULT_ROLES, resolveRoles, type RolePalette } from "../src/roles";

const palette: RolePalette = {
  params: { ...DEFAULT_CUBEHELIX_PARAMS },
  roles: DEFAULT_ROLES,
};

describe("DEFAULT_ROLES", () => {
  test("provides ten roles with t in [0, 1]", () => {
    expect(DEFAULT_ROLES.length).toBe(10);
    for (const r of DEFAULT_ROLES) {
      expect(r.t).toBeGreaterThanOrEqual(0);
      expect(r.t).toBeLessThanOrEqual(1);
    }
  });

  test("ascending t produces brightness-ordered roles", () => {
    let prev = -Infinity;
    for (const r of DEFAULT_ROLES) {
      expect(r.t).toBeGreaterThanOrEqual(prev);
      prev = r.t;
    }
  });
});

describe("resolveRoles", () => {
  test("returns one resolved role per input role", () => {
    const resolved = resolveRoles(palette);
    expect(resolved).toHaveLength(palette.roles.length);
    for (let i = 0; i < palette.roles.length; i++) {
      expect(resolved[i]?.name).toBe(palette.roles[i]?.name);
      expect(resolved[i]?.t).toBe(palette.roles[i]?.t);
      expect(resolved[i]?.rgb.r).toBeGreaterThanOrEqual(0);
      expect(resolved[i]?.rgb.r).toBeLessThanOrEqual(1);
    }
  });

  test("preserves role order", () => {
    const custom: RolePalette = {
      params: { ...DEFAULT_CUBEHELIX_PARAMS },
      roles: [
        { name: "z", t: 0.9 },
        { name: "a", t: 0.1 },
        { name: "m", t: 0.5 },
      ],
    };
    const resolved = resolveRoles(custom);
    expect(resolved.map((r) => r.name)).toEqual(["z", "a", "m"]);
  });

  test("custom roles work with non-default params", () => {
    const custom: RolePalette = {
      params: { ...DEFAULT_CUBEHELIX_PARAMS, saturation: 1.5 },
      roles: [{ name: "only", t: 0.5 }],
    };
    const resolved = resolveRoles(custom);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.name).toBe("only");
  });
});

describe("contrastMatrix", () => {
  test("returns NxN matrix matching the role count", () => {
    const m = contrastMatrix(palette);
    expect(m.names).toHaveLength(palette.roles.length);
    expect(m.ratios).toHaveLength(palette.roles.length);
    for (const row of m.ratios) {
      expect(row).toHaveLength(palette.roles.length);
    }
  });

  test("diagonal is 1 (a color has contrast 1 with itself)", () => {
    const m = contrastMatrix(palette);
    for (let i = 0; i < m.names.length; i++) {
      expect(m.ratios[i]?.[i]).toBeCloseTo(1, 12);
    }
  });

  test("matrix is symmetric (contrast(a, b) === contrast(b, a))", () => {
    const m = contrastMatrix(palette);
    for (let i = 0; i < m.names.length; i++) {
      for (let j = 0; j < m.names.length; j++) {
        expect(m.ratios[i]?.[j]).toBeCloseTo(m.ratios[j]?.[i] ?? 0, 12);
      }
    }
  });

  test("default-roles palette has high contrast between extremes", () => {
    const m = contrastMatrix(palette);
    const first = 0;
    const last = m.names.length - 1;
    expect(m.ratios[first]?.[last]).toBeGreaterThan(7);
  });
});
