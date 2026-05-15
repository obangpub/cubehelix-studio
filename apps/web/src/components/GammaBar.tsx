import { useId, useMemo } from "react";
import { helixGeometry, type CubehelixParams } from "@cubehelix-studio/core";

interface GammaBarProps {
  params: CubehelixParams;
  height?: number;
}

const STOP_COUNT = 64;

export function GammaBar({ params, height = 20 }: GammaBarProps) {
  const gradientId = useId();
  const stops = useMemo(() => {
    return Array.from({ length: STOP_COUNT + 1 }, (_, i) => {
      const t = i / STOP_COUNT;
      // The achromatic ramp is the helix lightness fraction at saturation 0.
      const v = Math.round(helixGeometry(t, params).fraction * 255);
      return { offset: t, color: `rgb(${v} ${v} ${v})` };
    });
  }, [params]);

  return (
    <svg
      className="gamma-bar"
      role="img"
      aria-label="Lightness ramp shaped by the lightness curve"
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
