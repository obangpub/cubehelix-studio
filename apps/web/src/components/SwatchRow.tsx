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
  const swatches = useMemo(() => {
    // Hex stays as the underlying palette color (the data); only the rendered
    // swatch background goes through the preview transform, with text contrast
    // computed against what's displayed.
    return sampleSequential(params, count).map((color) => {
      const previewed = applyPreview(color, previewMode);
      return {
        bg: toCssRgb(previewed),
        hex: toHex(color),
        text: toCssRgb(pickTextColor(previewed)),
      };
    });
  }, [params, count, previewMode]);
  return (
    <div
      className="swatch-row"
      role="list"
      aria-label="Discrete palette samples"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {swatches.map((s, i) => (
        <div key={i} role="listitem" className="swatch" style={{ background: s.bg, color: s.text }}>
          <span className="swatch-hex">{s.hex}</span>
        </div>
      ))}
    </div>
  );
}
