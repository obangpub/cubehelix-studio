import { SWATCH_COUNT_BOUNDS } from "../lib/url-state";
import { Slider } from "./Slider";

interface PreviewSidePanelProps {
  swatchCount: number;
  onSwatchCountChange: (count: number) => void;
  reverse: boolean;
  onReverseChange: (reverse: boolean) => void;
  onExportClick: () => void;
}

export function PreviewSidePanel({
  swatchCount,
  onSwatchCountChange,
  reverse,
  onReverseChange,
  onExportClick,
}: PreviewSidePanelProps) {
  return (
    <aside className="preview-side-panel" aria-label="Preview controls">
      <Slider
        label="Swatches"
        technicalName="swatchCount"
        value={swatchCount}
        min={SWATCH_COUNT_BOUNDS.min}
        max={SWATCH_COUNT_BOUNDS.max}
        step={1}
        onChange={(value) => onSwatchCountChange(Math.round(value))}
      />
      <label className="toggle">
        <input
          type="checkbox"
          checked={reverse}
          onChange={(e) => onReverseChange(e.currentTarget.checked)}
        />
        <span className="slider-label">Reverse</span>
      </label>
      <button type="button" className="preview-side-panel-export" onClick={onExportClick}>
        Export…
      </button>
    </aside>
  );
}
