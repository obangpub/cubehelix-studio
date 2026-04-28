import { useMemo } from "react";
import {
  pickTextColor,
  sampleSequential,
  toCssRgb,
  toHex,
  type CubehelixParams,
} from "@cubehelix-studio/core";

interface SwatchRowProps {
  params: CubehelixParams;
  count?: number;
}

export function SwatchRow({ params, count = 9 }: SwatchRowProps) {
  const swatches = useMemo(() => {
    return sampleSequential(params, count).map((color) => ({
      bg: toCssRgb(color),
      hex: toHex(color),
      text: toCssRgb(pickTextColor(color)),
    }));
  }, [params, count]);
  return (
    <div className="swatch-row" role="list" aria-label="Discrete palette samples">
      {swatches.map((s, i) => (
        <div key={i} role="listitem" className="swatch" style={{ background: s.bg, color: s.text }}>
          <span className="swatch-hex">{s.hex}</span>
        </div>
      ))}
    </div>
  );
}
