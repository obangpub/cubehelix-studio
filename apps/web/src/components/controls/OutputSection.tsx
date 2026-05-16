import type { CubehelixParams } from "@cubehelix-studio/core";
import { SWATCH_COUNT_BOUNDS } from "../../lib/url-state";
import { Slider } from "../Slider";

interface OutputSectionProps {
  params: CubehelixParams;
  applyParamsPatch: (patch: Partial<CubehelixParams>) => void;
  swatchCount: number;
  onSwatchCountChange: (count: number) => void;
}

export function OutputSection({
  params,
  applyParamsPatch,
  swatchCount,
  onSwatchCountChange,
}: OutputSectionProps) {
  return (
    <section className="controls">
      <details className="control-section">
        <summary className="control-section-header">
          <span className="control-section-title">Output</span>
          <span className="control-section-chevron" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="control-section-body">
          <label className="toggle">
            <input
              type="checkbox"
              checked={params.reverse}
              onChange={(e) => applyParamsPatch({ reverse: e.currentTarget.checked })}
            />
            <span className="slider-label">Reverse</span>
          </label>
          <Slider
            label="Swatches"
            technicalName="swatchCount"
            value={swatchCount}
            min={SWATCH_COUNT_BOUNDS.min}
            max={SWATCH_COUNT_BOUNDS.max}
            step={1}
            onChange={(value) => onSwatchCountChange(Math.round(value))}
          />
        </div>
      </details>
    </section>
  );
}
