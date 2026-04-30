import type { CSSProperties } from "react";

interface RangeSliderProps {
  label: string;
  technicalNameMin: string;
  technicalNameMax: string;
  valueMin: number;
  valueMax: number;
  min: number;
  max: number;
  step: number;
  thumbMinColor?: string;
  thumbMaxColor?: string;
  onChange: (next: { min: number; max: number }) => void;
}

export function RangeSlider({
  label,
  technicalNameMin,
  technicalNameMax,
  valueMin,
  valueMax,
  min,
  max,
  step,
  thumbMinColor,
  thumbMaxColor,
  onChange,
}: RangeSliderProps) {
  const idMin = `range-${technicalNameMin}`;
  const idMax = `range-${technicalNameMax}`;
  const numberIdMin = `${idMin}-number`;
  const numberIdMax = `${idMax}-number`;

  const commitMin = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const clamped = Math.min(valueMax, Math.max(min, raw));
    onChange({ min: clamped, max: valueMax });
  };
  const commitMax = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const clamped = Math.min(max, Math.max(valueMin, raw));
    onChange({ min: valueMin, max: clamped });
  };

  const span = max - min;
  const minPct = span > 0 ? ((valueMin - min) / span) * 100 : 0;
  const maxPct = span > 0 ? ((valueMax - min) / span) * 100 : 100;

  return (
    <div className="range-slider">
      <div className="range-slider-header">
        <span className="slider-label">{label}</span>
        <span className="range-slider-values">
          <input
            id={numberIdMin}
            className="slider-value"
            type="number"
            value={valueMin}
            min={min}
            max={valueMax}
            step={step}
            onChange={(e) => commitMin(e.currentTarget.valueAsNumber)}
            aria-label={`${label} minimum value`}
          />
          <input
            id={numberIdMax}
            className="slider-value"
            type="number"
            value={valueMax}
            min={valueMin}
            max={max}
            step={step}
            onChange={(e) => commitMax(e.currentTarget.valueAsNumber)}
            aria-label={`${label} maximum value`}
          />
        </span>
      </div>
      <div className="range-slider-track">
        <div
          className="range-slider-fill"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          id={idMin}
          className="thumb-min"
          type="range"
          value={valueMin}
          min={min}
          max={max}
          step={step}
          style={thumbMinColor ? ({ "--thumb-color": thumbMinColor } as CSSProperties) : undefined}
          onChange={(e) => commitMin(Number(e.target.value))}
          aria-label={`${label} minimum`}
        />
        <input
          id={idMax}
          className="thumb-max"
          type="range"
          value={valueMax}
          min={min}
          max={max}
          step={step}
          style={thumbMaxColor ? ({ "--thumb-color": thumbMaxColor } as CSSProperties) : undefined}
          onChange={(e) => commitMax(Number(e.target.value))}
          aria-label={`${label} maximum`}
        />
      </div>
    </div>
  );
}
