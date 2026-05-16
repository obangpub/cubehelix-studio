import { useCallback, useEffect, useId, useRef } from "react";
import { helixGeometry, type CubehelixParams } from "@cubehelix-studio/core";

const FIELD_WIDTH = 88;
const FIELD_HEIGHT = 132;
const DARK_T_RANGE: [number, number] = [0, 0.3];
const LIGHT_T_RANGE: [number, number] = [0.7, 1];

interface SaturationFieldProps {
  params: CubehelixParams;
  saturationMin: number;
  saturationMax: number;
  linked: boolean;
  max: number;
  scaleExponent: number;
  step: number;
  onChange: (next: { min: number; max: number }) => void;
  onLinkedChange: (next: boolean) => void;
}

export function SaturationField({
  params,
  saturationMin,
  saturationMax,
  linked,
  max,
  scaleExponent,
  step,
  onChange,
  onLinkedChange,
}: SaturationFieldProps) {
  // Both handlers commit through a single onChange so linked drags update min
  // and max in one render — two sequential setStates would race on stale params
  // and silently leave the values unequal, which would flip linked → false.
  const handleDarkChange = useCallback(
    (v: number) => {
      onChange({ min: v, max: linked ? v : saturationMax });
    },
    [linked, onChange, saturationMax],
  );
  const handleLightChange = useCallback(
    (v: number) => {
      onChange({ min: linked ? v : saturationMin, max: v });
    },
    [linked, onChange, saturationMin],
  );

  return (
    <div className="saturation-field">
      <div className="saturation-field-row">
        <SaturationFieldBox
          side="dark"
          params={params}
          ownValue={saturationMin}
          otherValue={saturationMax}
          linked={linked}
          max={max}
          scaleExponent={scaleExponent}
          step={step}
          onChange={handleDarkChange}
        />
        <button
          type="button"
          className="saturation-link-toggle"
          onClick={() => onLinkedChange(!linked)}
          aria-pressed={linked}
          title={
            linked
              ? "Unlink to set dark and light saturation independently"
              : "Link sliders so dark and light saturation match"
          }
          aria-label={linked ? "Unlink saturation sliders" : "Link saturation sliders"}
        >
          {linked ? <LinkedIcon /> : <UnlinkedIcon />}
        </button>
        <SaturationFieldBox
          side="light"
          params={params}
          ownValue={saturationMax}
          otherValue={saturationMin}
          linked={linked}
          max={max}
          scaleExponent={scaleExponent}
          step={step}
          onChange={handleLightChange}
        />
      </div>
    </div>
  );
}

interface SaturationFieldBoxProps {
  side: "dark" | "light";
  params: CubehelixParams;
  ownValue: number;
  otherValue: number;
  linked: boolean;
  max: number;
  scaleExponent: number;
  step: number;
  onChange: (next: number) => void;
}

function SaturationFieldBox({
  side,
  params,
  ownValue,
  otherValue,
  linked,
  max,
  scaleExponent,
  step,
  onChange,
}: SaturationFieldBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawField(canvas, side, params, otherValue, linked, max, scaleExponent);
  }, [params, side, otherValue, linked, max, scaleExponent]);

  const positionToValue = (p: number): number => {
    const clamped = Math.max(0, Math.min(1, p));
    const v = max * Math.pow(clamped, scaleExponent);
    if (step > 0) {
      const decimals = Math.max(0, Math.ceil(-Math.log10(step)));
      return Number(v.toFixed(decimals));
    }
    return v;
  };
  const valueToPosition = (v: number): number => {
    const clamped = Math.max(0, Math.min(max, v));
    return Math.pow(clamped / max, 1 / scaleExponent);
  };

  const updateFromPointer = (clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const yFromTop = clientY - rect.top;
    const positionFromBottom = 1 - yFromTop / rect.height;
    onChange(positionToValue(positionFromBottom));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    updateFromPointer(e.clientY);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const big = step * 10;
    let next: number;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        next = Math.min(max, ownValue + step);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        next = Math.max(0, ownValue - step);
        break;
      case "PageUp":
        next = Math.min(max, ownValue + big);
        break;
      case "PageDown":
        next = Math.max(0, ownValue - big);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(next);
  };

  const thumbBottomPercent = valueToPosition(ownValue) * 100;
  const label = side === "dark" ? "Dark" : "Light";

  return (
    <div className="saturation-field-box">
      <div className="saturation-field-label">{label}</div>
      <div
        ref={trackRef}
        className="saturation-field-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        role="slider"
        tabIndex={0}
        aria-label={`${label} saturation`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Number(ownValue.toFixed(2))}
        aria-orientation="vertical"
      >
        <canvas
          ref={canvasRef}
          width={FIELD_WIDTH}
          height={FIELD_HEIGHT}
          className="saturation-field-canvas"
        />
        <div
          className="saturation-field-thumb"
          style={{ bottom: `${thumbBottomPercent}%` }}
          aria-hidden
        />
      </div>
      <input
        id={inputId}
        className="saturation-field-number"
        type="number"
        value={ownValue}
        min={0}
        max={max}
        step={step}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          if (!Number.isFinite(v)) return;
          onChange(Math.max(0, Math.min(max, v)));
        }}
        aria-label={`${label} saturation value`}
      />
    </div>
  );
}

function drawField(
  canvas: HTMLCanvasElement,
  side: "dark" | "light",
  params: CubehelixParams,
  otherValue: number,
  linked: boolean,
  max: number,
  scaleExponent: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const image = ctx.createImageData(w, h);
  const data = image.data;

  const [tStart, tEnd] = side === "dark" ? DARK_T_RANGE : LIGHT_T_RANGE;
  // The field is drawn in fixed palette orientation: the left box edits the
  // dark end and the right box the light end, independent of the `reverse`
  // toggle. Geometry comes from core with `reverse` neutralized so the t
  // ranges above keep mapping to those fixed ends.
  const geometryParams: CubehelixParams = params.reverse ? { ...params, reverse: false } : params;

  const columnT = new Float64Array(w);
  const fraction = new Float64Array(w);
  const envelope = new Float64Array(w);
  const dr = new Float64Array(w);
  const dg = new Float64Array(w);
  const db = new Float64Array(w);

  for (let x = 0; x < w; x++) {
    const t = tStart + (tEnd - tStart) * (x / (w - 1));
    columnT[x] = t;
    const geom = helixGeometry(t, geometryParams);
    fraction[x] = geom.fraction;
    envelope[x] = geom.envelope;
    dr[x] = geom.dr;
    dg[x] = geom.dg;
    db[x] = geom.db;
  }

  for (let y = 0; y < h; y++) {
    const positionFromBottom = (h - 1 - y) / (h - 1);
    const rowSat = max * Math.pow(positionFromBottom, scaleExponent);
    for (let x = 0; x < w; x++) {
      const t = columnT[x]!;
      const f = fraction[x]!;
      const env = envelope[x]!;
      const drx = dr[x]!;
      const dgx = dg[x]!;
      const dbx = db[x]!;
      let effSat: number;
      if (linked) {
        effSat = rowSat;
      } else if (side === "dark") {
        effSat = rowSat + (otherValue - rowSat) * t;
      } else {
        effSat = otherValue + (rowSat - otherValue) * t;
      }
      const amp = effSat * env;
      const r = clamp01(f + amp * drx);
      const g = clamp01(f + amp * dgx);
      const b = clamp01(f + amp * dbx);
      const i = (y * w + x) * 4;
      data[i] = Math.round(r * 255);
      data[i + 1] = Math.round(g * 255);
      data[i + 2] = Math.round(b * 255);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function LinkedIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect
        x="3.5"
        y="7"
        width="9"
        height="6.5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7"
      />
    </svg>
  );
}

function UnlinkedIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect
        x="3.5"
        y="7"
        width="9"
        height="6.5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0"
      />
    </svg>
  );
}
