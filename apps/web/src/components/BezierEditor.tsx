import { useId, useMemo, useRef, useState } from "react";
import { clamp01 } from "../lib/math";

type Pair = readonly [number, number];

interface BezierEditorProps {
  p1: Pair;
  p2: Pair;
  onChange: (p1: [number, number], p2: [number, number]) => void;
}

const VIEW_PADDING = 0.08;
const HANDLE_RADIUS = 0.04;
const CURVE_SAMPLES = 48;

function cubicAt(s: number, p1: Pair, p2: Pair): { x: number; y: number } {
  const omS = 1 - s;
  const x = 3 * omS * omS * s * p1[0] + 3 * omS * s * s * p2[0] + s * s * s;
  const y = 3 * omS * omS * s * p1[1] + 3 * omS * s * s * p2[1] + s * s * s;
  return { x, y };
}

export function BezierEditor({ p1, p2, onChange }: BezierEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const titleId = useId();
  const [active, setActive] = useState<1 | 2 | null>(null);

  const curvePath = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const s = i / CURVE_SAMPLES;
      const { x, y } = cubicAt(s, p1, p2);
      points.push(`${x},${1 - y}`);
    }
    return `M ${points.join(" L ")}`;
  }, [p1, p2]);

  const updateHandle = (
    handle: 1 | 2,
    clientX: number,
    clientY: number,
    constrainX: { min: number; max: number },
  ) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const usableW = rect.width / (1 + 2 * VIEW_PADDING);
    const usableH = rect.height / (1 + 2 * VIEW_PADDING);
    const offsetX = (rect.width - usableW) / 2;
    const offsetY = (rect.height - usableH) / 2;
    const xRaw = (clientX - rect.left - offsetX) / usableW;
    const yRaw = 1 - (clientY - rect.top - offsetY) / usableH;
    const x = clamp01(xRaw);
    const y = clamp01(yRaw);
    if (handle === 1) {
      const constrainedX = Math.min(x, constrainX.max);
      onChange([constrainedX, y], [p2[0], p2[1]]);
    } else {
      const constrainedX = Math.max(x, constrainX.min);
      onChange([p1[0], p1[1]], [constrainedX, y]);
    }
  };

  const onPointerDown = (handle: 1 | 2) => (e: React.PointerEvent<SVGCircleElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(handle);
    updateHandle(
      handle,
      e.clientX,
      e.clientY,
      handle === 1 ? { min: 0, max: p2[0] } : { min: p1[0], max: 1 },
    );
  };
  const onPointerMove = (handle: 1 | 2) => (e: React.PointerEvent<SVGCircleElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateHandle(
      handle,
      e.clientX,
      e.clientY,
      handle === 1 ? { min: 0, max: p2[0] } : { min: p1[0], max: 1 },
    );
  };
  const onPointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setActive(null);
  };

  // Keyboard / direct-entry path: each component is a number input below the
  // canvas. The curve must stay monotonic in x (p1.x <= p2.x). A typed x-value
  // is honored as entered; the opposite handle's x is moved to preserve the
  // ordering, so an explicit entry is never silently rejected.
  const commitComponent = (handle: 1 | 2, axis: 0 | 1, raw: number) => {
    if (!Number.isFinite(raw)) return;
    const v = clamp01(raw);
    if (handle === 1) {
      const x = axis === 0 ? v : p1[0];
      const y = axis === 1 ? v : p1[1];
      onChange([x, y], [Math.max(p2[0], x), p2[1]]);
    } else {
      const x = axis === 0 ? v : p2[0];
      const y = axis === 1 ? v : p2[1];
      onChange([Math.min(p1[0], x), p1[1]], [x, y]);
    }
  };

  const componentFields = [
    { label: "P1 x", handle: 1, axis: 0, value: p1[0], min: 0, max: 1 },
    { label: "P1 y", handle: 1, axis: 1, value: p1[1], min: 0, max: 1 },
    { label: "P2 x", handle: 2, axis: 0, value: p2[0], min: 0, max: 1 },
    { label: "P2 y", handle: 2, axis: 1, value: p2[1], min: 0, max: 1 },
  ] as const;

  const viewMin = -VIEW_PADDING;
  const viewSize = 1 + 2 * VIEW_PADDING;

  return (
    <div className="bezier-editor">
      <svg
        ref={svgRef}
        className="bezier-editor-canvas"
        viewBox={`${viewMin} ${viewMin} ${viewSize} ${viewSize}`}
        role="group"
        aria-labelledby={titleId}
      >
        <title id={titleId}>Bezier curve handles</title>
        <rect
          x={0}
          y={0}
          width={1}
          height={1}
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth={0.005}
        />
        <line
          x1={0}
          y1={1}
          x2={1}
          y2={0}
          stroke="var(--border)"
          strokeWidth={0.004}
          strokeDasharray="0.02 0.02"
        />
        <path d={curvePath} fill="none" stroke="var(--fg)" strokeWidth={0.012} />
        <line x1={0} y1={1} x2={p1[0]} y2={1 - p1[1]} stroke="var(--muted)" strokeWidth={0.005} />
        <line x1={1} y1={0} x2={p2[0]} y2={1 - p2[1]} stroke="var(--muted)" strokeWidth={0.005} />
        <circle
          cx={p1[0]}
          cy={1 - p1[1]}
          r={HANDLE_RADIUS}
          fill="var(--accent, #4ea0ff)"
          stroke={active === 1 ? "var(--fg)" : "transparent"}
          strokeWidth={0.008}
          cursor="grab"
          onPointerDown={onPointerDown(1)}
          onPointerMove={onPointerMove(1)}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <circle
          cx={p2[0]}
          cy={1 - p2[1]}
          r={HANDLE_RADIUS}
          fill="var(--accent, #4ea0ff)"
          stroke={active === 2 ? "var(--fg)" : "transparent"}
          strokeWidth={0.008}
          cursor="grab"
          onPointerDown={onPointerDown(2)}
          onPointerMove={onPointerMove(2)}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </svg>
      <div className="bezier-editor-inputs">
        {componentFields.map((f) => (
          <label key={f.label} className="bezier-input">
            <span>{f.label}</span>
            <input
              type="number"
              className="slider-value"
              value={Number(f.value.toFixed(3))}
              min={f.min}
              max={f.max}
              step={0.01}
              onChange={(e) => commitComponent(f.handle, f.axis, e.target.valueAsNumber)}
              aria-label={`Bezier ${f.label}`}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
