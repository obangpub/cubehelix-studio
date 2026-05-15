import { useMemo } from "react";
import {
  applyPreview,
  pickTextColor,
  sampleSequential,
  toCssRgb,
  toHex,
  type CubehelixParams,
  type PreviewMode,
} from "@cubehelix-studio/core";

interface SwatchRowProps {
  params: CubehelixParams;
  count?: number;
  previewMode?: PreviewMode;
}

export function SwatchRow({ params, count = 9, previewMode = "normal" }: SwatchRowProps) {
  // sampleSequential requires n >= 2; clamp defensively so an out-of-range
  // count (e.g. a future caller, or a regression in the bounds) can't throw.
  const safeCount = Math.max(2, Math.round(count));
  const swatches = useMemo(() => {
    // Hex stays as the underlying palette color (the data); only the rendered
    // swatch background goes through the preview transform, with text contrast
    // computed against what's displayed.
    return sampleSequential(params, safeCount).map((color) => {
      const previewed = applyPreview(color, previewMode);
      return {
        bg: toCssRgb(previewed),
        hex: toHex(color),
        text: toCssRgb(pickTextColor(previewed)),
      };
    });
  }, [params, safeCount, previewMode]);
  return (
    <div
      className="swatch-row"
      role="list"
      aria-label="Discrete palette samples"
      style={{ gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))` }}
    >
      {swatches.map((s, i) => (
        <div
          key={i}
          role="listitem"
          className="swatch"
          style={{ background: s.bg, color: s.text }}
          aria-label={s.hex}
        >
          <span className="swatch-hex">{s.hex}</span>
        </div>
      ))}
    </div>
  );
}
