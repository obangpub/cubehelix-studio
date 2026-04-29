import { toHex } from "./format";
import { resolveRoles, type RolePalette } from "./roles";
import type { CubehelixParams } from "./types";

export type ExportFormat = "css" | "tailwind" | "scss" | "json" | "python";

export interface SerializeOptions {
  prefix?: string;
}

interface ResolvedHex {
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

function resolveHex(palette: RolePalette): ResolvedHex[] {
  return resolveRoles(palette).map(({ name, rgb }) => ({
    name,
    hex: toHex(rgb),
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
  }));
}

function serializeCss(palette: RolePalette, prefix: string): string {
  const resolved = resolveHex(palette);
  const lines = resolved.map((r) => `  --${prefix}-${r.name}: ${r.hex};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}

function serializeTailwind(palette: RolePalette, prefix: string): string {
  const resolved = resolveHex(palette);
  const lines = resolved.map((r) => `  --${prefix}-${r.name}: ${r.hex};`);
  return `@theme {\n${lines.join("\n")}\n}\n`;
}

function serializeScss(palette: RolePalette, prefix: string): string {
  const resolved = resolveHex(palette);
  const lines = resolved.map((r) => `$${prefix}-${r.name}: ${r.hex};`);
  return `${lines.join("\n")}\n`;
}

function serializeJson(palette: RolePalette, prefix: string): string {
  const resolved = resolveHex(palette);
  const obj: Record<string, string> = {};
  for (const r of resolved) {
    obj[`${prefix}-${r.name}`] = r.hex;
  }
  return `${JSON.stringify(obj, null, 2)}\n`;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return `${n}.0`;
  return n.toString();
}

function camelToSnake(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function serializePython(palette: RolePalette): string {
  const paramLines = Object.entries(palette.params).map(
    ([k, v]) => `    ${camelToSnake(k)}=${formatNumber(v as number)},`,
  );
  const resolved = resolveHex(palette);
  const roleLines = resolved.map(
    (r) => `    "${r.name}": (${r.r.toFixed(6)}, ${r.g.toFixed(6)}, ${r.b.toFixed(6)}),`,
  );
  return `from cubehelix_studio import CubehelixParams, to_matplotlib_colormap

params = CubehelixParams(
${paramLines.join("\n")}
)

# Continuous matplotlib colormap
cmap = to_matplotlib_colormap(params, name="custom")

# Role colors as (r, g, b) tuples in [0, 1]
roles = {
${roleLines.join("\n")}
}
`;
}

export function serialize(
  palette: RolePalette,
  format: ExportFormat,
  options: SerializeOptions = {},
): string {
  const prefix = options.prefix ?? "color";
  switch (format) {
    case "css":
      return serializeCss(palette, prefix);
    case "tailwind":
      return serializeTailwind(palette, prefix);
    case "scss":
      return serializeScss(palette, prefix);
    case "json":
      return serializeJson(palette, prefix);
    case "python":
      return serializePython(palette);
  }
}

export function paramsToString(params: CubehelixParams): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v as number}`)
    .join(", ");
}
