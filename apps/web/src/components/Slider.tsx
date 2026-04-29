interface SliderProps {
  label: string;
  technicalName: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function Slider({ label, technicalName, value, min, max, step, onChange }: SliderProps) {
  const id = `slider-${technicalName}`;
  const numberId = `${id}-number`;
  const commit = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const clamped = Math.min(max, Math.max(min, raw));
    onChange(clamped);
  };
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
          min={min}
          max={max}
          step={step}
          onChange={(e) => commit(e.target.valueAsNumber)}
          aria-label={`${label} value`}
        />
      </label>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => commit(Number(e.target.value))}
      />
    </div>
  );
}
