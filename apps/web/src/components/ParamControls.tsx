import type { CubehelixParams } from "@lumenfast/core";
import { Slider } from "./Slider";

interface ParamControlsProps {
  params: CubehelixParams;
  onChange: (params: CubehelixParams) => void;
}

export function ParamControls({ params, onChange }: ParamControlsProps) {
  const update = (key: keyof CubehelixParams) => (value: number) => {
    onChange({ ...params, [key]: value });
  };
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
    </section>
  );
}
