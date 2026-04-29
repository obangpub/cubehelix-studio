import { useMemo } from "react";
import { cubehelix, toCssRgb, type CubehelixParams } from "@cubehelix-studio/core";
import { SWATCH_COUNT_BOUNDS } from "../lib/url-state";
import { RangeSlider } from "./RangeSlider";
import { Slider } from "./Slider";

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
  return (
    <section className="controls">
      <Slider
        label="Starting Hue"
        technicalName="start"
        value={params.start}
        min={0}
        max={3}
        step={0.05}
        onChange={update("start")}
      />
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
        max={2}
        step={0.01}
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
