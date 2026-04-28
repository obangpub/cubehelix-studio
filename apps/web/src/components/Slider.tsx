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
  return (
    <div className="slider">
      <label htmlFor={id}>
        <span className="slider-titles">
          <span className="slider-label">{label}</span>
          <span className="slider-technical">{technicalName}</span>
        </span>
        <span className="slider-value">{value.toFixed(2)}</span>
      </label>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
