import { useMemo, useRef } from "react";
import {
  cubehelix,
  DEFAULT_LIGHTNESS_CURVE,
  toCssRgb,
  type CubehelixParams,
} from "@cubehelix-studio/core";
import { useKeyboardStepper } from "../hooks/useKeyboardStepper";
import { usePointerDrag } from "../hooks/usePointerDrag";
import { mod } from "../lib/math";

interface StartingHueWheelProps {
  value: number;
  onChange: (next: number) => void;
  ariaLabel?: string;
  compact?: boolean;
}

const SEGMENT_COUNT = 60;
const OUTER_RADIUS = 1;
const INNER_RADIUS = 0.6;
const POINTER_INNER = INNER_RADIUS - 0.04;
const POINTER_OUTER = OUTER_RADIUS + 0.04;

// Pin sampling so each segment shows the abstract hue for that start.
// Rotations=0 makes the angle equal to 2π·(start/3 + 1) regardless of
// helix position; sampling at t=0.5 with the default identity curve puts
// the lightness fraction at 0.5, where the chroma envelope peaks. Together,
// the pointer color is the mathematically pure starting hue at maximum
// visible chroma — it does not depend on the user's rotation count.
const REFERENCE_T = 0.5;

// Maximum saturation that keeps every hue in [0, 1] at fraction=0.5 with
// the default chroma envelope. The binding constraint is along the B
// direction at angle 0 or π (|B_dir| = 1.97294, peak amplitude 0.125):
//   s_max = 0.5 / (0.125 · 1.97294) ≈ 2.027
// 2.0 leaves a tiny floating-point buffer.
const WHEEL_SATURATION = 2.0;

function wheelParams(start: number): CubehelixParams {
  return {
    start,
    rotations: 0,
    saturationMin: WHEEL_SATURATION,
    saturationMax: WHEEL_SATURATION,
    lightnessCurve: DEFAULT_LIGHTNESS_CURVE,
    lightnessAxisMin: 0,
    lightnessAxisMax: 1,
    chromaPeak: 0.5,
    chromaWidth: 1,
    chromaFloor: 0,
    reverse: false,
  };
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

export function StartingHueWheel({
  value,
  onChange,
  ariaLabel = "Starting Hue",
  compact = false,
}: StartingHueWheelProps) {
  const segments = useMemo(() => {
    const out: { path: string; color: string }[] = [];
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const segStart = ((i + 0.5) / SEGMENT_COUNT) * 3;
      const color = toCssRgb(cubehelix(REFERENCE_T, wheelParams(segStart)));
      const a0 = (i / SEGMENT_COUNT) * 2 * Math.PI;
      const a1 = ((i + 1) / SEGMENT_COUNT) * 2 * Math.PI;
      out.push({ path: arcSegmentPath(a0, a1), color });
    }
    return out;
  }, []);

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
    onChange(mod((theta / (2 * Math.PI)) * 3, 3));
  };

  const drag = usePointerDrag<SVGSVGElement>({
    onDrag: (e) => updateFromPointer(e.clientX, e.clientY),
  });

  // The wheel is periodic over [0, 3), so keyboard steps wrap via mod. End
  // lands just shy of a full turn so it stays distinct from Home.
  const KEY_STEP = 0.05;
  const KEY_STEP_LARGE = 0.5;
  const onKeyDown = useKeyboardStepper({
    value,
    step: KEY_STEP,
    largeStep: KEY_STEP_LARGE,
    homeValue: 0,
    endValue: 3 - KEY_STEP,
    bound: (v) => mod(v, 3),
    onChange,
  });

  const pointerAngle = angleAt(mod(value, 3));
  const pInner = pointFromAngle(pointerAngle, POINTER_INNER);
  const pOuter = pointFromAngle(pointerAngle, POINTER_OUTER);
  // Fill the wheel's inner disc with the pure hue at the current value so the
  // selected color is visible at a glance, not just inferred from the pointer
  // position.
  const selectedColor = useMemo(
    () => toCssRgb(cubehelix(REFERENCE_T, wheelParams(mod(value, 3)))),
    [value],
  );

  return (
    <svg
      ref={svgRef}
      className={compact ? "hue-wheel hue-wheel--compact" : "hue-wheel"}
      viewBox="-1.15 -1.15 2.3 2.3"
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={3}
      aria-valuenow={Number(mod(value, 3).toFixed(3))}
      {...drag}
      onKeyDown={onKeyDown}
    >
      {segments.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} />
      ))}
      <circle cx={0} cy={0} r={INNER_RADIUS} fill={selectedColor} />
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
