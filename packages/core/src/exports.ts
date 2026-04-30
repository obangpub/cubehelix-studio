import { toHex } from "./format";
import { resolveRoles, type RolePalette } from "./roles";
import type { CubehelixParams, LightnessCurve } from "./types";

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

function curveClassName(curve: LightnessCurve): string {
  switch (curve.kind) {
    case "power":
      return "PowerCurve";
    case "sigmoid":
      return "SigmoidCurve";
    case "bezier":
      return "BezierCurve";
  }
}

function formatCurvePython(curve: LightnessCurve): string {
  switch (curve.kind) {
    case "power":
      return `PowerCurve(gamma=${formatNumber(curve.gamma)})`;
    case "sigmoid":
      return `SigmoidCurve(steepness=${formatNumber(curve.steepness)}, midpoint=${formatNumber(curve.midpoint)})`;
    case "bezier":
      return `BezierCurve(p1=(${formatNumber(curve.p1[0])}, ${formatNumber(curve.p1[1])}), p2=(${formatNumber(curve.p2[0])}, ${formatNumber(curve.p2[1])}))`;
  }
}

function isLightnessCurve(value: unknown): value is LightnessCurve {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    typeof (value as { kind: unknown }).kind === "string"
  );
}

function formatPythonValue(v: unknown): string {
  if (typeof v === "boolean") return v ? "True" : "False";
  if (isLightnessCurve(v)) return formatCurvePython(v);
  return formatNumber(v as number);
}

function serializePython(palette: RolePalette): string {
  const paramLines = Object.entries(palette.params).map(
    ([k, v]) => `    ${camelToSnake(k)}=${formatPythonValue(v)},`,
  );
  const resolved = resolveHex(palette);
  const roleLines = resolved.map(
    (r) => `    "${r.name}": (${r.r.toFixed(6)}, ${r.g.toFixed(6)}, ${r.b.toFixed(6)}),`,
  );
  const importNames = [
    "CubehelixParams",
    curveClassName(palette.params.lightnessCurve),
    "to_matplotlib_colormap",
  ];
  return `from cubehelix_studio import ${importNames.join(", ")}

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
    .map(([k, v]) => `${k}=${formatParamValue(v)}`)
    .join(", ");
}

function formatParamValue(v: unknown): string {
  if (typeof v === "boolean") return String(v);
  if (isLightnessCurve(v)) {
    const args = curveArgsString(v);
    return `${v.kind}(${args})`;
  }
  return String(v);
}

function curveArgsString(curve: LightnessCurve): string {
  switch (curve.kind) {
    case "power":
      return `gamma=${curve.gamma}`;
    case "sigmoid":
      return `steepness=${curve.steepness}, midpoint=${curve.midpoint}`;
    case "bezier":
      return `p1=[${curve.p1[0]},${curve.p1[1]}], p2=[${curve.p2[0]},${curve.p2[1]}]`;
  }
}
