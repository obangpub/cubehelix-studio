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
  onChange,
}: SliderProps) {
  const id = `slider-${technicalName}`;
  const numberId = `${id}-number`;
  const effectiveNumberMin = numberMin ?? min;
  const effectiveNumberMax = numberMax ?? max;
  const isScaled = scaleExponent !== 1 && max > min;
  const span = max - min;

  const valueToPosition = (v: number): number => {
    const clamped = Math.min(max, Math.max(min, v));
    const linear = (clamped - min) / span;
    return Math.pow(linear, 1 / scaleExponent);
  };
  const positionToValue = (p: number): number => {
    const clamped = Math.min(1, Math.max(0, p));
    return min + span * Math.pow(clamped, scaleExponent);
  };

  const commitFromSlider = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    let v = isScaled ? positionToValue(raw) : raw;
    if (isScaled && step > 0) {
      const decimals = Math.max(0, Math.ceil(-Math.log10(step)));
      v = Number(v.toFixed(decimals));
    }
    onChange(Math.min(max, Math.max(min, v)));
  };
  const commitFromNumber = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    onChange(Math.min(effectiveNumberMax, Math.max(effectiveNumberMin, raw)));
  };
  const sliderValue = isScaled ? valueToPosition(value) : Math.min(max, Math.max(min, value));
  const sliderMin = isScaled ? 0 : min;
  const sliderMax = isScaled ? 1 : max;
  const sliderStep = isScaled ? POSITION_STEP : step;
  return (
    <div className="slider">
      <label htmlFor={id}>
        <span className="slider-titles">
          <span className="slider-label">{label}</span>
          <span className="slider-technical">{technicalName}</span>
        </span>
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
      />
    </div>
  );
}
