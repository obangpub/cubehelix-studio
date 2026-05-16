// Generates the announcement comparison image: one cubehelix palette shown as
// a continuous gradient and discrete swatches, repeated under grayscale and a
// CVD simulation, to demonstrate that luminance order survives each transform.
import { writeFileSync } from "node:fs";
import {
  applyPreview,
  getPresetById,
  sampleSequential,
  toCssRgb,
  type CubehelixParams,
  type PreviewMode,
} from "../packages/core/dist/index.js";

const preset = getPresetById("classic");
if (!preset) throw new Error("preset 'classic' not found");
const params = preset.params as CubehelixParams;

const ROWS: { mode: PreviewMode; label: string }[] = [
  { mode: "normal", label: "Original" },
  { mode: "grayscale", label: "Grayscale" },
  { mode: "deuteranopia", label: "Deuteranopia (CVD)" },
];

const GRADIENT_STEPS = 256;
const SWATCH_COUNT = 9;

const W = 1280;
const PAD = 48;
const LABEL_W = 248;
const SWATCH_GAP = 16;
const SWATCH_H = 56;
const GRADIENT_H = 78;
const ROW_H = GRADIENT_H + SWATCH_GAP + SWATCH_H;
const ROW_GAP = 44;
const TITLE_H = 96;
const H = TITLE_H + PAD + ROWS.length * ROW_H + (ROWS.length - 1) * ROW_GAP + PAD;

const gradient = sampleSequential(params, GRADIENT_STEPS);
const swatches = sampleSequential(params, SWATCH_COUNT);

const stripW = W - PAD * 2 - LABEL_W;
const stripX = PAD + LABEL_W;

const parts: string[] = [];
parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
);
parts.push(`<rect width="${W}" height="${H}" fill="#0e0f12"/>`);
parts.push(
  `<text x="${PAD}" y="58" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#f5f6f8">Cubehelix Studio &#8212; palettes that survive grayscale and CVD</text>`,
);
parts.push(
  `<text x="${PAD}" y="86" font-family="Inter, Helvetica, Arial, sans-serif" font-size="18" fill="#9aa0a8">Monotonic luminance is built into the curve, so light-to-dark order survives every transform &#8212; for any palette, not just this one.</text>`,
);

ROWS.forEach((row, ri) => {
  const rowY = TITLE_H + PAD + ri * (ROW_H + ROW_GAP);

  parts.push(
    `<text x="${PAD}" y="${rowY + ROW_H / 2 + 7}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="#d6d9de">${row.label}</text>`,
  );

  // Continuous gradient as adjacent thin rects.
  const cellW = stripW / GRADIENT_STEPS;
  gradient.forEach((rgb, i) => {
    const c = toCssRgb(applyPreview(rgb, row.mode));
    // Overlap by 1px to avoid hairline seams after rasterization.
    parts.push(
      `<rect x="${(stripX + i * cellW).toFixed(3)}" y="${rowY}" width="${(cellW + 1).toFixed(3)}" height="${GRADIENT_H}" fill="${c}"/>`,
    );
  });

  // Discrete swatches below the gradient.
  const swatchY = rowY + GRADIENT_H + SWATCH_GAP;
  const totalGap = SWATCH_GAP * (SWATCH_COUNT - 1);
  const swatchW = (stripW - totalGap) / SWATCH_COUNT;
  swatches.forEach((rgb, i) => {
    const c = toCssRgb(applyPreview(rgb, row.mode));
    const x = stripX + i * (swatchW + SWATCH_GAP);
    parts.push(
      `<rect x="${x.toFixed(3)}" y="${swatchY}" width="${swatchW.toFixed(3)}" height="${SWATCH_H}" rx="6" fill="${c}"/>`,
    );
  });
});

parts.push("</svg>");

const outSvg = new URL("../docs/assets/announce-cvd.svg", import.meta.url);
writeFileSync(outSvg, parts.join("\n"));
console.log(`wrote ${outSvg.pathname}`);
