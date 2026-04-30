import { useMemo, useRef } from "react";
import {
  cubehelix,
  DEFAULT_LIGHTNESS_CURVE,
  toCssRgb,
  type CubehelixParams,
} from "@cubehelix-studio/core";

interface StartingHueWheelProps {
  value: number;
  onChange: (next: number) => void;
  params: CubehelixParams;
  shading: boolean;
}

const SEGMENT_COUNT = 60;
const OUTER_RADIUS = 1;
const INNER_RADIUS = 0.6;
const POINTER_INNER = INNER_RADIUS - 0.04;
const POINTER_OUTER = OUTER_RADIUS + 0.04;
const REFERENCE_T = 0.5;

function neutralParamsFor(start: number): CubehelixParams {
  return {
    start,
    rotations: 0,
    saturation: 1,
    lightnessCurve: DEFAULT_LIGHTNESS_CURVE,
    lightnessMin: 0,
    lightnessMax: 1,
    chromaPeak: 0.5,
    chromaWidth: 1,
    chromaFloor: 0,
    reverse: false,
  };
}

function mod3(v: number): number {
  return ((v % 3) + 3) % 3;
}

function angleAt(start: number): number {
  return (start / 3) * 2 * Math.PI;
}

function pointFromAngle(angle: number, radius: number): { x: number; y: number } {
  return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius };
}

function arcSegmentPath(angleStart: number, angleEnd: number): string {
  const o0 = pointFromAngle(angleStart, OUTER_RADIUS);
  const o1 = pointFromAngle(angleEnd, OUTER_RADIUS);
  const i0 = pointFromAngle(angleStart, INNER_RADIUS);
  const i1 = pointFromAngle(angleEnd, INNER_RADIUS);
  return `M ${o0.x} ${o0.y} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${i0.x} ${i0.y} Z`;
}

export function StartingHueWheel({ value, onChange, params, shading }: StartingHueWheelProps) {
  const segments = useMemo(() => {
    const out: { path: string; color: string }[] = [];
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const segStart = ((i + 0.5) / SEGMENT_COUNT) * 3;
      // Each segment shows the hue family at the start angle. We pin rotations
      // to 0 so the angle at REFERENCE_T equals 2π·(start/3 + 1) regardless of
      // the user's rotation count — otherwise the displayed hue drifts by
      // rotations·π·REFERENCE_T from the actual start angle.
      const segParams: CubehelixParams = shading
        ? { ...params, start: segStart, rotations: 0 }
        : neutralParamsFor(segStart);
      const color = toCssRgb(cubehelix(REFERENCE_T, segParams));
      const a0 = (i / SEGMENT_COUNT) * 2 * Math.PI;
      const a1 = ((i + 1) / SEGMENT_COUNT) * 2 * Math.PI;
      out.push({ path: arcSegmentPath(a0, a1), color });
    }
    return out;
  }, [params, shading]);

  const svgRef = useRef<SVGSVGElement>(null);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    if (dx === 0 && dy === 0) return;
    let theta = Math.atan2(dx, -dy);
    if (theta < 0) theta += 2 * Math.PI;
    onChange(mod3((theta / (2 * Math.PI)) * 3));
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateFromPointer(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const pointerAngle = angleAt(mod3(value));
  const pInner = pointFromAngle(pointerAngle, POINTER_INNER);
  const pOuter = pointFromAngle(pointerAngle, POINTER_OUTER);

  return (
    <svg
      ref={svgRef}
      className="hue-wheel"
      viewBox="-1.15 -1.15 2.3 2.3"
      role="slider"
      aria-label="Starting Hue"
      aria-valuemin={0}
      aria-valuemax={3}
      aria-valuenow={Number(mod3(value).toFixed(3))}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {segments.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} />
      ))}
      <circle cx={0} cy={0} r={INNER_RADIUS} fill="var(--surface)" />
      <line
        x1={pInner.x}
        y1={pInner.y}
        x2={pOuter.x}
        y2={pOuter.y}
        stroke="var(--fg)"
        strokeWidth={0.04}
        strokeLinecap="round"
      />
      <circle
        cx={pOuter.x}
        cy={pOuter.y}
        r={0.08}
        fill="var(--fg)"
        stroke="var(--surface)"
        strokeWidth={0.02}
      />
    </svg>
  );
}
