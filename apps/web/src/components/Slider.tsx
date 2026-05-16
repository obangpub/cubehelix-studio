import type { ReactNode } from "react";
import { positionToValue, valueToPosition } from "../lib/scale";

interface SliderProps {
  label: string;
  technicalName: string;
  value: number;
  min: number;
  max: number;
  step: number;
  numberMin?: number;
  numberMax?: number;
  scaleExponent?: number;
  help?: ReactNode;
  onChange: (value: number) => void;
}

const POSITION_STEP = 0.001;

export function Slider({
  label,
  technicalName,
  value,
  min,
  max,
  step,
  numberMin,
  numberMax,
  scaleExponent = 1,
  help,
  onChange,
}: SliderProps) {
  const id = `slider-${technicalName}`;
  const numberId = `${id}-number`;
  const effectiveNumberMin = numberMin ?? min;
  const effectiveNumberMax = numberMax ?? max;
  const isScaled = scaleExponent !== 1 && max > min;
  const scale = { min, max, exponent: scaleExponent, step };

  const commitFromSlider = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const v = isScaled ? positionToValue(raw, scale) : raw;
    onChange(Math.min(max, Math.max(min, v)));
  };
  const commitFromNumber = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    onChange(Math.min(effectiveNumberMax, Math.max(effectiveNumberMin, raw)));
  };
  const sliderValue = isScaled
    ? valueToPosition(value, scale)
    : Math.min(max, Math.max(min, value));
  const sliderMin = isScaled ? 0 : min;
  const sliderMax = isScaled ? 1 : max;
  const sliderStep = isScaled ? POSITION_STEP : step;
  return (
    <div className="slider">
      <label htmlFor={id}>
        <span className="slider-label">{label}</span>
        {help}
        <input
          id={numberId}
          className="slider-value"
          type="number"
          value={value}
          min={Number.isFinite(effectiveNumberMin) ? effectiveNumberMin : undefined}
          max={Number.isFinite(effectiveNumberMax) ? effectiveNumberMax : undefined}
          step={step}
          onChange={(e) => commitFromNumber(e.target.valueAsNumber)}
          aria-label={`${label} value`}
        />
      </label>
      <input
        id={id}
        type="range"
        value={sliderValue}
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        onChange={(e) => commitFromSlider(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
