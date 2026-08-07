import { useMemo, useRef } from "react";
import type { HueWaypoint } from "@cubehelix-studio/core";
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

interface HueDualWheelProps {
  waypoints: [HueWaypoint, HueWaypoint];
  activeIndex: 0 | 1;
  onActiveChange: (idx: 0 | 1) => void;
  onHueChange: (idx: 0 | 1, hue: number) => void;
}

const POINTER_INNER = INNER_RADIUS - 0.04;
const POINTER_OUTER = OUTER_RADIUS + 0.04;

// Waypoint hue is in turns [0, 1); the wheel geometry speaks start units [0, 3).
const toStart = (hue: number) => mod(hue, 1) * 3;

// Two half-discs split the center: index 0 fills the top, index 1 the bottom.
// Sweep flag 0 bulges up (negative y), 1 bulges down.
const halfPath = (top: boolean) =>
  top
    ? `M ${-INNER_RADIUS} 0 A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${INNER_RADIUS} 0 Z`
    : `M ${-INNER_RADIUS} 0 A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 1 ${INNER_RADIUS} 0 Z`;

export function HueDualWheel({
  waypoints,
  activeIndex,
  onActiveChange,
  onHueChange,
}: HueDualWheelProps) {
  const segments = useMemo(() => hueRingSegments(), []);
  const svgRef = useRef<SVGSVGElement>(null);

  const turnsFromPointer = (clientX: number, clientY: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    if (dx === 0 && dy === 0) return null;
    let theta = Math.atan2(dx, -dy);
    if (theta < 0) theta += 2 * Math.PI;
    return mod(theta / (2 * Math.PI), 1);
  };

  // Dragging the ring background edits whichever waypoint is active.
  const bgDrag = usePointerDrag<SVGSVGElement>({
    onDrag: (e) => {
      const t = turnsFromPointer(e.clientX, e.clientY);
      if (t !== null) onHueChange(activeIndex, t);
    },
  });

  // Each pointer is independently draggable and activates its own waypoint, so
  // either hue can be grabbed directly. stopPropagation keeps the background
  // drag (which targets the active waypoint) from also firing.
  const dot0Drag = usePointerDrag<SVGGElement>({
    stopPropagation: true,
    onStart: () => onActiveChange(0),
    onDrag: (e) => {
      const t = turnsFromPointer(e.clientX, e.clientY);
      if (t !== null) onHueChange(0, t);
    },
  });
  const dot1Drag = usePointerDrag<SVGGElement>({
    stopPropagation: true,
    onStart: () => onActiveChange(1),
    onDrag: (e) => {
      const t = turnsFromPointer(e.clientX, e.clientY);
      if (t !== null) onHueChange(1, t);
    },
  });
  const dotDrags = [dot0Drag, dot1Drag] as const;

  const activeHue = waypoints[activeIndex].hue;
  const KEY_STEP = 0.02;
  const KEY_STEP_LARGE = 0.1;
  const onKeyDown = useKeyboardStepper({
    value: activeHue,
    step: KEY_STEP,
    largeStep: KEY_STEP_LARGE,
    homeValue: 0,
    endValue: 1 - KEY_STEP,
    bound: (v) => mod(v, 1),
    onChange: (next) => onHueChange(activeIndex, next),
  });

  return (
    <svg
      ref={svgRef}
      className="hue-wheel"
      viewBox="-1.18 -1.18 2.36 2.36"
      role="slider"
      tabIndex={0}
      aria-label={`Waypoint ${activeIndex + 1} hue`}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Number(mod(activeHue, 1).toFixed(3))}
      {...bgDrag}
      onKeyDown={onKeyDown}
    >
      {segments.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} />
      ))}
      {/* Split center: each half shows one waypoint's pinned hue at full
          saturation, unshaded. The surface-colored edge doubles as the palette
          cleanser ring against the segments and the divider between halves; the
          active half is outlined in the foreground color. Tap a half to make
          that waypoint active without moving its hue. */}
      {([0, 1] as const).map((idx) => {
        const active = activeIndex === idx;
        return (
          <path
            key={idx}
            d={halfPath(idx === 0)}
            fill={hueColorAt(toStart(waypoints[idx].hue))}
            stroke={active ? "var(--fg)" : "var(--surface)"}
            strokeWidth={active ? 0.05 : 0.04}
            style={{ cursor: "pointer" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onActiveChange(idx);
            }}
          />
        );
      })}
      {([0, 1] as const).map((idx) => {
        const active = activeIndex === idx;
        const a = angleAt(toStart(waypoints[idx].hue));
        const pIn = pointFromAngle(a, POINTER_INNER);
        const pOut = pointFromAngle(a, POINTER_OUTER);
        return (
          <g key={idx} {...dotDrags[idx]} style={{ cursor: "grab" }}>
            <line
              x1={pIn.x}
              y1={pIn.y}
              x2={pOut.x}
              y2={pOut.y}
              stroke={active ? "var(--fg)" : "var(--muted)"}
              strokeWidth={active ? 0.04 : 0.03}
              strokeLinecap="round"
            />
            <circle
              cx={pOut.x}
              cy={pOut.y}
              r={active ? 0.12 : 0.1}
              fill={active ? "var(--fg)" : "var(--surface)"}
              stroke={active ? "var(--surface)" : "var(--muted)"}
              strokeWidth={0.025}
            />
            <text
              x={pOut.x}
              y={pOut.y}
              fontSize={0.13}
              textAnchor="middle"
              dominantBaseline="central"
              fill={active ? "var(--surface)" : "var(--muted)"}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {idx + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
