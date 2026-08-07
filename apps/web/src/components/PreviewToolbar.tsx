import { SWATCH_COUNT_BOUNDS } from "../lib/url-state";

interface PreviewToolbarProps {
  swatchCount: number;
  onSwatchCountChange: (count: number) => void;
  reverse: boolean;
  onReverseChange: (reverse: boolean) => void;
  onExportClick: () => void;
}

// A compact strip that lives inside the preview panel: a small integer stepper
// for the swatch count, the reverse toggle, and the Export trigger. Replaces the
// old full-width Slider-based side panel, which gave the count its own column.
export function PreviewToolbar({
  swatchCount,
  onSwatchCountChange,
  reverse,
  onReverseChange,
  onExportClick,
}: PreviewToolbarProps) {
  const { min, max } = SWATCH_COUNT_BOUNDS;
  const setCount = (n: number) => {
    if (!Number.isFinite(n)) return;
    onSwatchCountChange(Math.min(max, Math.max(min, Math.round(n))));
  };

  return (
    <div className="preview-toolbar">
      <div className="swatch-stepper">
        <span className="swatch-stepper-label">Swatches</span>
        <div className="stepper">
          <input
            className="stepper-input"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={1}
            value={swatchCount}
            onChange={(e) => setCount(e.currentTarget.valueAsNumber)}
            aria-label="Swatches"
          />
          <span className="stepper-buttons">
            <button
              type="button"
              className="stepper-button"
              onClick={() => setCount(swatchCount + 1)}
              disabled={swatchCount >= max}
              aria-label="Increase swatches"
            >
              ▲
            </button>
            <button
              type="button"
              className="stepper-button"
              onClick={() => setCount(swatchCount - 1)}
              disabled={swatchCount <= min}
              aria-label="Decrease swatches"
            >
              ▼
            </button>
          </span>
        </div>
      </div>
      <label className="toggle">
        <input
          type="checkbox"
          checked={reverse}
          onChange={(e) => onReverseChange(e.currentTarget.checked)}
        />
        <span className="slider-label">Reverse</span>
      </label>
      <button type="button" className="preview-toolbar-export" onClick={onExportClick}>
        Export…
      </button>
    </div>
  );
}
