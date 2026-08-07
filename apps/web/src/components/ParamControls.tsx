import type { CubehelixParams, HueWaypoint } from "@cubehelix-studio/core";
import type { HueAuthoringState } from "../lib/url-state";
import { ChromaSection } from "./controls/ChromaSection";
import { HueSection } from "./controls/HueSection";
import { LightnessSection } from "./controls/LightnessSection";
import type { WaypointSolution } from "./controls/useHueAuthoring";
import { useRememberedCurves } from "./controls/useRememberedCurves";

interface ParamControlsProps {
  params: CubehelixParams;
  onChange: (params: CubehelixParams) => void;
  hueAuthoring: HueAuthoringState;
  onHueAuthoringChange: (next: HueAuthoringState) => void;
  applyParamsPatch: (patch: Partial<CubehelixParams>) => void;
  enterWaypointMode: () => void;
  setWaypoint: (idx: 0 | 1, next: HueWaypoint) => void;
  setWinding: (next: number) => void;
  waypointSolved: WaypointSolution;
}

/** The Hue, Lightness, and Saturation control sections. Hue-authoring
 *  orchestration is lifted to App so the Export panel's Reverse toggle can
 *  share it; the lightness-curve memory hook stays here, where the preset
 *  remount re-seeds it. Each section owns its own rendering. */
export function ParamControls({
  params,
  onChange,
  hueAuthoring,
  onHueAuthoringChange,
  applyParamsPatch,
  enterWaypointMode,
  setWaypoint,
  setWinding,
  waypointSolved,
}: ParamControlsProps) {
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
        setWinding={setWinding}
        waypointSolved={waypointSolved}
      />
      <LightnessSection
        params={params}
        applyParamsPatch={applyParamsPatch}
        setCurve={setCurve}
        switchKind={switchKind}
      />
      <ChromaSection params={params} applyParamsPatch={applyParamsPatch} />
    </>
  );
}
