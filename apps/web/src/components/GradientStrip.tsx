import { useId, useMemo } from "react";
import {
  applyPreview,
  cubehelix,
  toCssRgb,
  type CubehelixParams,
  type PreviewMode,
} from "@cubehelix-studio/core";

interface GradientStripProps {
  params: CubehelixParams;
  previewMode?: PreviewMode;
  height?: number;
}

const STOP_COUNT = 64;

export function GradientStrip({ params, previewMode = "normal", height = 60 }: GradientStripProps) {
  const gradientId = useId();
  const stops = useMemo(() => {
    return Array.from({ length: STOP_COUNT + 1 }, (_, i) => {
      const t = i / STOP_COUNT;
      return { offset: t, color: toCssRgb(applyPreview(cubehelix(t, params), previewMode)) };
    });
  }, [params, previewMode]);

  return (
    <svg
      className="gradient-strip"
      role="img"
      aria-label="Continuous cubehelix gradient"
      width="100%"
      height={height}
      preserveAspectRatio="none"
      viewBox="0 0 100 1"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          {stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <rect width="100" height="1" fill={`url(#${gradientId})`} />
    </svg>
  );
}
