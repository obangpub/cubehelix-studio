import type { CubehelixParams } from "@cubehelix-studio/core";
import type { HueAuthoringState } from "../lib/url-state";
import { ChromaSection } from "./controls/ChromaSection";
import { HueSection } from "./controls/HueSection";
import { LightnessSection } from "./controls/LightnessSection";
import { OutputSection } from "./controls/OutputSection";
import { useHueAuthoring } from "./controls/useHueAuthoring";
import { useRememberedCurves } from "./controls/useRememberedCurves";

interface ParamControlsProps {
  params: CubehelixParams;
  onChange: (params: CubehelixParams) => void;
  swatchCount: number;
  onSwatchCountChange: (count: number) => void;
  hueAuthoring: HueAuthoringState;
  onHueAuthoringChange: (next: HueAuthoringState) => void;
}

/** The Hue / Lightness / Chroma / Output control sections. Waypoint solving
 *  and lightness-curve memory live in the two hooks; each section owns its
 *  own rendering. */
export function ParamControls({
  params,
  onChange,
  swatchCount,
  onSwatchCountChange,
  hueAuthoring,
  onHueAuthoringChange,
}: ParamControlsProps) {
  const { applyParamsPatch, enterWaypointMode, setWaypoint, waypointSolved } = useHueAuthoring(
    params,
    onChange,
    hueAuthoring,
    onHueAuthoringChange,
  );
  const { setCurve, switchKind } = useRememberedCurves(params.lightnessCurve, applyParamsPatch);

  return (
    <>
      <HueSection
        params={params}
        onChange={onChange}
        hueAuthoring={hueAuthoring}
        onHueAuthoringChange={onHueAuthoringChange}
        enterWaypointMode={enterWaypointMode}
        setWaypoint={setWaypoint}
        waypointSolved={waypointSolved}
      />
      <LightnessSection
        params={params}
        applyParamsPatch={applyParamsPatch}
        setCurve={setCurve}
        switchKind={switchKind}
      />
      <ChromaSection params={params} applyParamsPatch={applyParamsPatch} />
      <OutputSection
        params={params}
        applyParamsPatch={applyParamsPatch}
        swatchCount={swatchCount}
        onSwatchCountChange={onSwatchCountChange}
      />
    </>
  );
}
