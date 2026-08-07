import { useMemo, useRef } from "react";
import { useKeyboardStepper } from "../hooks/useKeyboardStepper";
import { usePointerDrag } from "../hooks/usePointerDrag";
import {
  angleAt,
  hueColorAt,
  hueRingSegments,
  INNER_RADIUS,
  OUTER_RADIUS,
  pointFromAngle,
} from "../lib/hue-wheel";
import { mod } from "../lib/math";

interface StartingHueWheelProps {
  value: number;
  onChange: (next: number) => void;
  ariaLabel?: string;
  compact?: boolean;
}

const POINTER_INNER = INNER_RADIUS - 0.04;
const POINTER_OUTER = OUTER_RADIUS + 0.04;

export function StartingHueWheel({
  value,
  onChange,
  ariaLabel = "Starting Hue",
  compact = false,
}: StartingHueWheelProps) {
  const segments = useMemo(() => hueRingSegments(), []);

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
  const selectedColor = useMemo(() => hueColorAt(mod(value, 3)), [value]);

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
      {/* A ring in the panel background color separates the wheel from the
          central color so adjacent hues don't induce edge-flicker or
          simultaneous-contrast shifts — a palette cleanser for the eye. */}
      <circle
        cx={0}
        cy={0}
        r={INNER_RADIUS}
        fill={selectedColor}
        stroke="var(--surface)"
        strokeWidth={0.04}
      />
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
