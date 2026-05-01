import { useId, useMemo } from "react";
import {
  evaluateLightnessCurve,
  invertLightnessCurve,
  type CubehelixParams,
} from "@cubehelix-studio/core";

interface GammaBarProps {
  params: CubehelixParams;
  height?: number;
}

const STOP_COUNT = 64;

export function GammaBar({ params, height = 20 }: GammaBarProps) {
  const gradientId = useId();
  const stops = useMemo(() => {
    const { lightnessCurve, lightnessAxisMin, lightnessAxisMax, reverse } = params;
    const uMin = invertLightnessCurve(lightnessCurve, lightnessAxisMin);
    const uMax = invertLightnessCurve(lightnessCurve, lightnessAxisMax);
    return Array.from({ length: STOP_COUNT + 1 }, (_, i) => {
      const t = i / STOP_COUNT;
      const tEff = reverse ? 1 - t : t;
      const u = uMin + (uMax - uMin) * tEff;
      const l = evaluateLightnessCurve(lightnessCurve, u);
      const v = Math.round(l * 255);
      return { offset: t, color: `rgb(${v} ${v} ${v})` };
    });
  }, [params.lightnessCurve, params.lightnessAxisMin, params.lightnessAxisMax, params.reverse]);

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
