// Generates the announcement hero mockup: the cubehelix curve drawn inside the
// RGB cube, with mock parameter sliders beneath it, to show that the tool
// generates a continuous space of palettes rather than a fixed set.
import { writeFileSync } from "node:fs";
import {
  cubehelix,
  getPresetById,
  sampleSequential,
  toCssRgb,
  type CubehelixParams,
  type RGB,
} from "../packages/core/dist/index.js";

const preset = getPresetById("classic");
if (!preset) throw new Error("preset 'classic' not found");
const params = preset.params as CubehelixParams;

type Vec3 = [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: Vec3): Vec3 => {
  const m = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / m, a[1] / m, a[2] / m];
};

// Camera looking at the cube from the corner used by the web app's cube view.
const CENTER: Vec3 = [0.5, 0.5, 0.5];
const CAM_DIR = norm([1.3, 0.9, 1.7]);
const CAM: Vec3 = [
  CENTER[0] + CAM_DIR[0] * 2,
  CENTER[1] + CAM_DIR[1] * 2,
  CENTER[2] + CAM_DIR[2] * 2,
];
const FORWARD = norm(sub(CENTER, CAM));
const RIGHT = norm(cross(FORWARD, [0, 1, 0]));
const UP = cross(RIGHT, FORWARD);

// Layout.
const W = 1040;
const PAD = 44;
const TITLE_H = 104;
const CUBE_H = 540;
const SLIDER_ROW_H = 64;
const SLIDER_ROWS = 2;
const STRIP_H = 78;
const H = TITLE_H + CUBE_H + SLIDER_ROWS * SLIDER_ROW_H + 28 + STRIP_H + PAD;

const cubeCx = W / 2;
const cubeCy = TITLE_H + CUBE_H / 2 - 2;
const CUBE_SCALE = 332;

/** Project a point in [0,1]^3 cube space to SVG coordinates. */
function project(p: Vec3): { x: number; y: number; depth: number } {
  const v = sub(p, CENTER);
  return {
    x: cubeCx + dot(v, RIGHT) * CUBE_SCALE,
    y: cubeCy - dot(v, UP) * CUBE_SCALE,
    depth: dot(v, FORWARD),
  };
}

const parts: string[] = [];
parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
);
parts.push(`<rect width="${W}" height="${H}" fill="#0e0f12"/>`);

const FONT = "Inter, Helvetica, Arial, sans-serif";
parts.push(
  `<text x="${PAD}" y="58" font-family="${FONT}" font-size="32" font-weight="700" fill="#f5f6f8">A continuous space of accessible palettes</text>`,
);
parts.push(
  `<text x="${PAD}" y="88" font-family="${FONT}" font-size="17" fill="#9aa0a8">Every palette is a curve through the RGB cube. Move the sliders, walk the space.</text>`,
);

// --- Cube wireframe ---
const corners: Vec3[] = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
];
const edges: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 4],
  [1, 5],
  [2, 4],
  [2, 6],
  [3, 5],
  [3, 6],
  [4, 7],
  [5, 7],
  [6, 7],
];
const projected = corners.map(project);

// Draw edges far-to-near so nearer edges sit on top; fade by depth.
const depths = edges.map((e) => (projected[e[0]]!.depth + projected[e[1]]!.depth) / 2);
const order = edges.map((_, i) => i).sort((a, b) => depths[a]! - depths[b]!);
const dMin = Math.min(...depths);
const dMax = Math.max(...depths);
for (const i of order) {
  const [a, b] = edges[i]!;
  const pa = projected[a]!;
  const pb = projected[b]!;
  const t = dMax === dMin ? 1 : (depths[i]! - dMin) / (dMax - dMin);
  const opacity = (0.22 + 0.5 * t).toFixed(2);
  parts.push(
    `<line x1="${pa.x.toFixed(2)}" y1="${pa.y.toFixed(2)}" x2="${pb.x.toFixed(2)}" y2="${pb.y.toFixed(2)}" stroke="#6b7079" stroke-width="1.6" stroke-opacity="${opacity}"/>`,
  );
}

// Grey diagonal: the black-to-white lightness axis.
const pK = project([0, 0, 0]);
const pW = project([1, 1, 1]);
parts.push(
  `<line x1="${pK.x.toFixed(2)}" y1="${pK.y.toFixed(2)}" x2="${pW.x.toFixed(2)}" y2="${pW.y.toFixed(2)}" stroke="#8b9099" stroke-width="1.4" stroke-dasharray="5 5" stroke-opacity="0.5"/>`,
);

// --- Helix curve through the cube ---
const HELIX_STEPS = 240;
for (let i = 0; i < HELIX_STEPS; i++) {
  const t0 = i / HELIX_STEPS;
  const t1 = (i + 1) / HELIX_STEPS;
  const c0 = cubehelix(t0, params);
  const c1 = cubehelix(t1, params);
  const a = project([c0.r, c0.g, c0.b]);
  const b = project([c1.r, c1.g, c1.b]);
  const mid: RGB = { r: (c0.r + c1.r) / 2, g: (c0.g + c1.g) / 2, b: (c0.b + c1.b) / 2 };
  parts.push(
    `<line x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" stroke="${toCssRgb(mid)}" stroke-width="7" stroke-linecap="round"/>`,
  );
}

// Cube corner vertices, colored by their RGB coordinate.
for (let i = 0; i < corners.length; i++) {
  const c = corners[i]!;
  const p = projected[i]!;
  parts.push(
    `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="5.5" fill="rgb(${c[0] * 255},${c[1] * 255},${c[2] * 255})" stroke="#0e0f12" stroke-width="1.5"/>`,
  );
}

// --- Mock sliders ---
type SliderSpec = { label: string; value: string; frac: number };
const gamma = params.lightnessCurve.kind === "power" ? params.lightnessCurve.gamma : 1;
const sliders: SliderSpec[] = [
  { label: "Starting hue", value: params.start.toFixed(2), frac: params.start },
  {
    label: "Rotations",
    value: params.rotations.toFixed(2),
    frac: (params.rotations + 3) / 6,
  },
  {
    label: "Saturation",
    value: params.saturationMax.toFixed(2),
    frac: params.saturationMax / 1.5,
  },
  { label: "Lightness gamma", value: gamma.toFixed(2), frac: gamma / 3 },
];

const sliderTop = TITLE_H + CUBE_H;
const COL_GAP = 56;
const cellW = (W - 2 * PAD - COL_GAP) / 2;
sliders.forEach((s, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const cellX = PAD + col * (cellW + COL_GAP);
  const cellY = sliderTop + row * SLIDER_ROW_H;
  const labelY = cellY + 20;
  const trackY = cellY + 42;
  // Label and value share the line above the track.
  parts.push(
    `<text x="${cellX}" y="${labelY}" font-family="${FONT}" font-size="16" font-weight="600" fill="#d6d9de">${s.label}</text>`,
  );
  parts.push(
    `<text x="${cellX + cellW}" y="${labelY}" font-family="${FONT}" font-size="15" fill="#9aa0a8" text-anchor="end">${s.value}</text>`,
  );
  // Track.
  parts.push(
    `<rect x="${cellX}" y="${trackY - 3}" width="${cellW.toFixed(2)}" height="6" rx="3" fill="#2a2d33"/>`,
  );
  const clamped = Math.max(0, Math.min(1, s.frac));
  const knobX = cellX + clamped * cellW;
  // Filled portion.
  parts.push(
    `<rect x="${cellX}" y="${trackY - 3}" width="${(clamped * cellW).toFixed(2)}" height="6" rx="3" fill="#6ea8ff"/>`,
  );
  // Knob.
  parts.push(
    `<circle cx="${knobX.toFixed(2)}" cy="${trackY}" r="10" fill="#f5f6f8" stroke="#6ea8ff" stroke-width="2.5"/>`,
  );
});

// --- Resulting palette strip ---
const stripY = sliderTop + SLIDER_ROWS * SLIDER_ROW_H + 28;
const stripX = PAD;
const stripW = W - PAD * 2;
const swatches = sampleSequential(params, 12);
const swW = stripW / swatches.length;
swatches.forEach((rgb, i) => {
  const x = stripX + i * swW;
  // Overlap by 1px to hide seams, but never past the strip's right edge.
  const last = i === swatches.length - 1;
  const w = last ? stripX + stripW - x : swW + 1;
  parts.push(
    `<rect x="${x.toFixed(3)}" y="${stripY}" width="${w.toFixed(3)}" height="${STRIP_H}" fill="${toCssRgb(rgb)}"/>`,
  );
});
// Mask the square swatch corners back to the page background so the strip
// reads as a rounded rectangle. (ImageMagick's SVG renderer ignores clipPath,
// so paint over the corner slivers rather than clipping.)
const STRIP_R = 8;
const x0 = stripX;
const x1 = stripX + stripW;
const y0 = stripY;
const y1 = stripY + STRIP_H;
const cornerMasks = [
  `M${x0},${y0 + STRIP_R} L${x0},${y0} L${x0 + STRIP_R},${y0} A${STRIP_R},${STRIP_R} 0 0 0 ${x0},${y0 + STRIP_R} Z`,
  `M${x1 - STRIP_R},${y0} L${x1},${y0} L${x1},${y0 + STRIP_R} A${STRIP_R},${STRIP_R} 0 0 0 ${x1 - STRIP_R},${y0} Z`,
  `M${x1},${y1 - STRIP_R} L${x1},${y1} L${x1 - STRIP_R},${y1} A${STRIP_R},${STRIP_R} 0 0 0 ${x1},${y1 - STRIP_R} Z`,
  `M${x0 + STRIP_R},${y1} L${x0},${y1} L${x0},${y1 - STRIP_R} A${STRIP_R},${STRIP_R} 0 0 0 ${x0 + STRIP_R},${y1} Z`,
];
for (const d of cornerMasks) {
  parts.push(`<path d="${d}" fill="#0e0f12"/>`);
}
parts.push(
  `<rect x="${stripX}" y="${stripY}" width="${stripW}" height="${STRIP_H}" rx="8" fill="none" stroke="#2a2d33" stroke-width="1.5"/>`,
);

parts.push("</svg>");

const outSvg = new URL("../docs/assets/announce-hero.svg", import.meta.url);
writeFileSync(outSvg, parts.join("\n"));
console.log(`wrote ${outSvg.pathname}`);
