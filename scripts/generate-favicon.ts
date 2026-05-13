import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { cubehelix, DEFAULT_CUBEHELIX_PARAMS } from "../packages/core/src/cubehelix";
import { toHex } from "../packages/core/src/format";

// Clip the t window so the dark/light ends don't fade into a light or dark
// browser tab background. The midrange of the default cubehelix is the most
// chromatic and reads on either theme.
const T_MIN = 0.15;
const T_MAX = 0.85;

const SAMPLES = 160;

type Variant = {
  outPath: string;
  size: number;
  turns: number;
  rx: number;
  ry: number;
  margin: number;
  strokeWidth: number;
  background: string | null;
};

const VARIANTS: Variant[] = [
  {
    outPath: "apps/web/public/favicon.svg",
    size: 32,
    turns: 2,
    rx: 9,
    ry: 3,
    margin: 6,
    strokeWidth: 3.5,
    background: null,
  },
  {
    // iOS home screen icon. Apple ignores SVG icons via apple-touch-icon, so
    // the build step rasterizes this to PNG; iOS also fills transparent areas
    // with its own (often black) background, so we paint our own dark canvas.
    outPath: "apps/web/public/apple-touch-icon.svg",
    size: 180,
    turns: 2,
    rx: 52,
    ry: 17,
    margin: 32,
    strokeWidth: 18,
    background: "#1a1a1a",
  },
];

function sampleColor(t: number): string {
  const tParam = T_MIN + (T_MAX - T_MIN) * t;
  return toHex(cubehelix(tParam, DEFAULT_CUBEHELIX_PARAMS));
}

function renderVariant(v: Variant): void {
  const cx = v.size / 2;
  const yTop = v.margin;
  const yBottom = v.size - v.margin;

  const helixPoint = (t: number) => {
    const angle = 2 * Math.PI * v.turns * t;
    const axialY = yTop + (yBottom - yTop) * t;
    return {
      x: cx + v.rx * Math.cos(angle),
      y: axialY + v.ry * Math.sin(angle),
    };
  };

  const segments: string[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const t0 = i / SAMPLES;
    const t1 = (i + 1) / SAMPLES;
    const p0 = helixPoint(t0);
    const p1 = helixPoint(t1);
    const color = sampleColor((t0 + t1) / 2);
    segments.push(
      `  <line x1="${p0.x.toFixed(3)}" y1="${p0.y.toFixed(3)}" x2="${p1.x.toFixed(3)}" y2="${p1.y.toFixed(3)}" stroke="${color}" />`,
    );
  }

  const bg = v.background
    ? `  <rect width="${v.size}" height="${v.size}" fill="${v.background}" />\n`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${v.size} ${v.size}">
${bg}  <g stroke-width="${v.strokeWidth}" stroke-linecap="round" fill="none">
${segments.join("\n")}
  </g>
</svg>
`;
  mkdirSync(dirname(v.outPath), { recursive: true });
  writeFileSync(v.outPath, svg);
  console.log(`wrote ${v.outPath} (${segments.length} segments)`);
}

for (const v of VARIANTS) renderVariant(v);
