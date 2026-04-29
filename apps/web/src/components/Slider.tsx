interface SliderProps {
  label: string;
  technicalName: string;
  value: number;
  min: number;
  max: number;
  step: number;
  numberMin?: number;
  numberMax?: number;
  onChange: (value: number) => void;
}

export function Slider({
  label,
  technicalName,
  value,
  min,
  max,
  step,
  numberMin,
  numberMax,
  onChange,
}: SliderProps) {
  const id = `slider-${technicalName}`;
  const numberId = `${id}-number`;
  const effectiveNumberMin = numberMin ?? min;
  const effectiveNumberMax = numberMax ?? max;
  const commitFromSlider = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    onChange(Math.min(max, Math.max(min, raw)));
  };
  const commitFromNumber = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    onChange(Math.min(effectiveNumberMax, Math.max(effectiveNumberMin, raw)));
  };
  const sliderValue = Math.min(max, Math.max(min, value));
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
        min={min}
        max={max}
        step={step}
        onChange={(e) => commitFromSlider(Number(e.target.value))}
      />
    </div>
  );
}
