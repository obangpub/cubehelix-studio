import { useMemo, useRef } from "react";
import {
  cubehelix,
  cubehelixRaw,
  toCssRgb,
  type CubehelixParams,
  type HueWaypoint,
} from "@cubehelix-studio/core";
import { useKeyboardStepper } from "../hooks/useKeyboardStepper";
import { usePointerDrag } from "../hooks/usePointerDrag";
import { clamp } from "../lib/math";

// Minimum separation in palette-t space between the two waypoints. Keeps
// u₁ ≈ u₂ from collapsing the solver to a degenerate case.
export const WAYPOINT_T_MIN_SEPARATION = 0.05;

interface HueWavePlotProps {
  params: CubehelixParams;
  waypoints: [HueWaypoint, HueWaypoint];
  activeIndex: 0 | 1;
  solved: boolean;
  onActiveChange: (idx: 0 | 1) => void;
  onPositionChange: (idx: 0 | 1, t: number) => void;
}

const SAMPLES = 96;
const VIEW_W = 300;
const VIEW_H = 120;
const PAD_X = 14;
const PLOT_W = VIEW_W - 2 * PAD_X;
const MID_Y = VIEW_H / 2;
const HALF_H = 44;
// Floor on the vertical scale so a low-chroma palette (a nearly flat wave)
// stays visibly small rather than being amplified to fill the height. The
// default palette's peak |v| is ~0.24, so it uses close to the full height.
const V_REF = 0.18;

// Orthographic projection of the (unclamped) helix onto the YGRK (blue=0) face,
// rotated so the gray axis is horizontal: vertical = (r − g) / √2. Black sits
// at the left (t=0), white at the right (t=1); the wave's frequency is the
// rotation count and its amplitude follows the chroma envelope.
const projectV = (params: CubehelixParams, t: number): number => {
  const { r, g } = cubehelixRaw(t, params);
  return (r - g) / Math.SQRT2;
};

const xOf = (t: number) => PAD_X + clamp(t, 0, 1) * PLOT_W;

export function HueWavePlot({
  params,
  waypoints,
  activeIndex,
  solved,
  onActiveChange,
  onPositionChange,
}: HueWavePlotProps) {
  const { segments, yScale } = useMemo(() => {
    const pts: { x: number; v: number; color: string }[] = [];
    let maxAbsV = 0;
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const v = projectV(params, t);
      if (Math.abs(v) > maxAbsV) maxAbsV = Math.abs(v);
      pts.push({ x: xOf(t), v, color: toCssRgb(cubehelix(t, params)) });
    }
    const scale = HALF_H / Math.max(maxAbsV, V_REF);
    const segs: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      segs.push({
        x1: a.x,
        y1: MID_Y - a.v * scale,
        x2: b.x,
        y2: MID_Y - b.v * scale,
        color: b.color,
      });
    }
    return { segments: segs, yScale: scale };
  }, [params]);

  const svgRef = useRef<SVGSVGElement>(null);

  // Allowed t-range for a handle, keeping the two waypoints ordered and apart.
  const boundT = (idx: 0 | 1, t: number): number =>
    idx === 0
      ? clamp(t, 0, Math.max(0, waypoints[1].t - WAYPOINT_T_MIN_SEPARATION))
      : clamp(t, Math.min(1, waypoints[0].t + WAYPOINT_T_MIN_SEPARATION), 1);

  const tFromPointer = (clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const viewX = ((clientX - rect.left) / rect.width) * VIEW_W;
    return (viewX - PAD_X) / PLOT_W;
  };

  const dot0Drag = usePointerDrag<SVGGElement>({
    stopPropagation: true,
    onStart: () => onActiveChange(0),
    onDrag: (e) => {
      const t = tFromPointer(e.clientX);
      if (t !== null) onPositionChange(0, boundT(0, t));
    },
  });
  const dot1Drag = usePointerDrag<SVGGElement>({
    stopPropagation: true,
    onStart: () => onActiveChange(1),
    onDrag: (e) => {
      const t = tFromPointer(e.clientX);
      if (t !== null) onPositionChange(1, boundT(1, t));
    },
  });
  const dotDrags = [dot0Drag, dot1Drag] as const;

  const KEY_STEP = 0.01;
  const KEY_STEP_LARGE = 0.05;
  const key0 = useKeyboardStepper({
    value: waypoints[0].t,
    step: KEY_STEP,
    largeStep: KEY_STEP_LARGE,
    homeValue: 0,
    endValue: 1,
    bound: (v) => boundT(0, v),
    onChange: (next) => onPositionChange(0, next),
  });
  const key1 = useKeyboardStepper({
    value: waypoints[1].t,
    step: KEY_STEP,
    largeStep: KEY_STEP_LARGE,
    homeValue: 0,
    endValue: 1,
    bound: (v) => boundT(1, v),
    onChange: (next) => onPositionChange(1, next),
  });
  const keyHandlers = [key0, key1] as const;

  return (
    <svg
      ref={svgRef}
      className={`hue-wave-plot${solved ? "" : " is-unsolved"}`}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="group"
      aria-label="Waypoint positions along the palette"
    >
      <line
        x1={PAD_X}
        y1={MID_Y}
        x2={VIEW_W - PAD_X}
        y2={MID_Y}
        stroke="var(--border-strong)"
        strokeWidth={1}
      />
      <text x={PAD_X} y={VIEW_H - 4} fontSize={9} fill="var(--muted)">
        black
      </text>
      <text x={VIEW_W - PAD_X} y={VIEW_H - 4} fontSize={9} textAnchor="end" fill="var(--muted)">
        white
      </text>
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={s.color}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      ))}
      {([0, 1] as const).map((idx) => {
        const active = activeIndex === idx;
        const t = waypoints[idx].t;
        const x = xOf(t);
        const y = MID_Y - projectV(params, t) * yScale;
        return (
          <g
            key={idx}
            {...dotDrags[idx]}
            tabIndex={0}
            role="slider"
            aria-label={`Waypoint ${idx + 1} position`}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={Number(t.toFixed(3))}
            onKeyDown={keyHandlers[idx]}
            onFocus={() => onActiveChange(idx)}
            style={{ cursor: "ew-resize" }}
          >
            <line
              x1={x}
              y1={MID_Y}
              x2={x}
              y2={y}
              stroke="var(--muted)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={x}
              cy={y}
              r={active ? 8 : 6.5}
              fill={toCssRgb(cubehelix(t, params))}
              stroke={active ? "var(--fg)" : "var(--border-strong)"}
              strokeWidth={active ? 2.5 : 1.5}
            />
            <text
              x={x}
              y={y - (active ? 12 : 10)}
              fontSize={10}
              textAnchor="middle"
              fill="var(--fg)"
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
