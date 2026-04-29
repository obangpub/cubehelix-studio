import { contrastRatio } from "./contrast";
import { cubehelix } from "./cubehelix";
import type { CubehelixParams, RGB } from "./types";

export interface PaletteRole {
  name: string;
  t: number;
}

export interface RolePalette {
  params: CubehelixParams;
  roles: PaletteRole[];
}

export const DEFAULT_ROLES: PaletteRole[] = [
  { name: "50", t: 0.02 },
  { name: "100", t: 0.08 },
  { name: "200", t: 0.18 },
  { name: "300", t: 0.3 },
  { name: "400", t: 0.42 },
  { name: "500", t: 0.55 },
  { name: "600", t: 0.65 },
  { name: "700", t: 0.75 },
  { name: "800", t: 0.85 },
  { name: "900", t: 0.96 },
];

export interface ResolvedRole {
  name: string;
  t: number;
  rgb: RGB;
}

export function resolveRoles(palette: RolePalette): ResolvedRole[] {
  return palette.roles.map(({ name, t }) => ({
    name,
    t,
    rgb: cubehelix(t, palette.params),
  }));
}

export interface ContrastMatrix {
  names: string[];
  ratios: number[][];
}

export function contrastMatrix(palette: RolePalette): ContrastMatrix {
  const resolved = resolveRoles(palette);
  const names = resolved.map((r) => r.name);
  const ratios = resolved.map((a) => resolved.map((b) => contrastRatio(a.rgb, b.rgb)));
  return { names, ratios };
}
