import { useMemo, useState } from "react";
import {
  cubehelix,
  saturationCap,
  toCssRgb,
  type CubehelixParams,
} from "@cubehelix-studio/core";
import { SWATCH_COUNT_BOUNDS } from "../lib/url-state";
import { RangeSlider } from "./RangeSlider";
import { Slider } from "./Slider";
import { StartingHueWheel } from "./StartingHueWheel";

function mod3(v: number): number {
  return ((v % 3) + 3) % 3;
}

interface ParamControlsProps {
  params: CubehelixParams;
  onChange: (params: CubehelixParams) => void;
  swatchCount: number;
  onSwatchCountChange: (count: number) => void;
}

export function ParamControls({
  params,
  onChange,
  swatchCount,
  onSwatchCountChange,
}: ParamControlsProps) {
  const update = (key: keyof CubehelixParams) => (value: number) => {
    onChange({ ...params, [key]: value });
  };
  const minThumbColor = useMemo(() => toCssRgb(cubehelix(0, params)), [params]);
  const maxThumbColor = useMemo(() => toCssRgb(cubehelix(1, params)), [params]);
  const saturationMax = useMemo(() => {
    const SAMPLES = 24;
    let max = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const start = (i / SAMPLES) * 3;
      const cap = saturationCap({ ...params, start });
      if (cap > max) max = cap;
    }
    return Number(max.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.rotations, params.gamma, params.lightnessMin, params.lightnessMax, params.reverse]);
  const [hueShading, setHueShading] = useState(true);
  const setStart = (v: number) => {
    if (!Number.isFinite(v)) return;
    onChange({ ...params, start: mod3(v) });
  };
  return (
    <section className="controls">
      <div className="hue-control">
        <div className="hue-control-header">
          <span className="slider-titles">
            <span className="slider-label">Starting Hue</span>
            <span className="slider-technical">start</span>
          </span>
          <input
            id="hue-control-number"
            className="slider-value"
            type="number"
            value={Number(mod3(params.start).toFixed(3))}
            step={0.05}
            onChange={(e) => setStart(e.currentTarget.valueAsNumber)}
            aria-label="Starting Hue value"
          />
        </div>
        <StartingHueWheel
          value={params.start}
          onChange={setStart}
          params={params}
          shading={hueShading}
        />
        <label className="hue-shading-toggle">
          <input
            type="checkbox"
            checked={hueShading}
            onChange={(e) => setHueShading(e.currentTarget.checked)}
          />
          <span>Shading</span>
        </label>
      </div>
      <Slider
        label="Hue Rotations"
        technicalName="rotations"
        value={params.rotations}
        min={-3}
        max={3}
        step={0.05}
        numberMin={-Infinity}
        numberMax={Infinity}
        onChange={update("rotations")}
      />
      <Slider
        label="Saturation"
        technicalName="saturation"
        value={params.saturation}
        min={0}
        max={saturationMax}
        step={0.01}
        scaleExponent={3}
        onChange={update("saturation")}
      />
      <Slider
        label="Lightness Curve"
        technicalName="gamma"
        value={params.gamma}
        min={0.5}
        max={2}
        step={0.01}
        onChange={update("gamma")}
      />
      <RangeSlider
        label="Lightness Range"
        technicalNameMin="lightnessMin"
        technicalNameMax="lightnessMax"
        valueMin={params.lightnessMin}
        valueMax={params.lightnessMax}
        min={0}
        max={1}
        step={0.01}
        thumbMinColor={minThumbColor}
        thumbMaxColor={maxThumbColor}
        onChange={({ min: nextMin, max: nextMax }) =>
          onChange({ ...params, lightnessMin: nextMin, lightnessMax: nextMax })
        }
      />
      <label className="toggle">
        <input
          type="checkbox"
          checked={params.reverse}
          onChange={(e) => onChange({ ...params, reverse: e.currentTarget.checked })}
        />
        <span className="slider-titles">
          <span className="slider-label">Reverse</span>
          <span className="slider-technical">reverse</span>
        </span>
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
    </section>
  );
}
