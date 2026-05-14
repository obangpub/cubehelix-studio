import { useId, useMemo, useState } from "react";
import {
  cubehelix,
  DEFAULT_BEZIER_P1,
  DEFAULT_BEZIER_P2,
  DEFAULT_POWER_GAMMA,
  DEFAULT_SIGMOID_MIDPOINT,
  DEFAULT_SIGMOID_STEEPNESS,
  findWindingForRotations,
  huesAtT,
  solveHueWaypoints,
  toCssRgb,
  type CubehelixParams,
  type HueWaypoint,
  type LightnessCurve,
} from "@cubehelix-studio/core";
import {
  CHROMA_FLOOR_BOUNDS,
  CHROMA_PEAK_BOUNDS,
  CHROMA_WIDTH_BOUNDS,
  SWATCH_COUNT_BOUNDS,
  type HueAuthoringState,
} from "../lib/url-state";
import { BezierEditor } from "./BezierEditor";
import { HelpPopover } from "./HelpPopover";
import { HueWaypointEditor } from "./HueWaypointEditor";
import { RangeSlider } from "./RangeSlider";
import { SaturationField } from "./SaturationField";
import { Slider } from "./Slider";
import { StartingHueWheel } from "./StartingHueWheel";

// Saturation slider tops out well past full-gamut so users can intentionally
// crank past the in-gamut range. The cubic slider scale (scaleExponent=3 on
// the Slider) puts the most-used 0..2 range across the lower ~76% of travel,
// leaving the upper portion for the rare 2..4.5 territory.
const SATURATION_SLIDER_MAX = 4.5;

function mod3(v: number): number {
  return ((v % 3) + 3) % 3;
}

interface ParamControlsProps {
  params: CubehelixParams;
  onChange: (params: CubehelixParams) => void;
  swatchCount: number;
  onSwatchCountChange: (count: number) => void;
  hueAuthoring: HueAuthoringState;
  onHueAuthoringChange: (next: HueAuthoringState) => void;
}

interface RememberedCurves {
  power: { gamma: number };
  sigmoid: { steepness: number; midpoint: number };
  bezier: { p1: [number, number]; p2: [number, number] };
}

function curvesFromParams(curve: LightnessCurve): RememberedCurves {
  return {
    power: {
      gamma: curve.kind === "power" ? curve.gamma : DEFAULT_POWER_GAMMA,
    },
    sigmoid:
      curve.kind === "sigmoid"
        ? { steepness: curve.steepness, midpoint: curve.midpoint }
        : { steepness: DEFAULT_SIGMOID_STEEPNESS, midpoint: DEFAULT_SIGMOID_MIDPOINT },
    bezier:
      curve.kind === "bezier"
        ? { p1: [...curve.p1] as [number, number], p2: [...curve.p2] as [number, number] }
        : {
            p1: [DEFAULT_BEZIER_P1[0], DEFAULT_BEZIER_P1[1]] as [number, number],
            p2: [DEFAULT_BEZIER_P2[0], DEFAULT_BEZIER_P2[1]] as [number, number],
          },
  };
}

export function ParamControls({
  params,
  onChange,
  swatchCount,
  onSwatchCountChange,
  hueAuthoring,
  onHueAuthoringChange,
}: ParamControlsProps) {
  // Apply a params patch while preserving waypoint mode: re-run the solver
  // when in waypoint mode so start/rotations stay derived from the user's
  // pinned waypoints under the new context (lightness curve / axis / reverse
  // are part of that context and all reshape u → t).
  const applyParamsPatch = (patch: Partial<CubehelixParams>) => {
    const nextParams = { ...params, ...patch };
    if (hueAuthoring.mode === "waypoints") {
      const solved = solveHueWaypoints(
        hueAuthoring.waypoints[0],
        hueAuthoring.waypoints[1],
        hueAuthoring.winding,
        {
          lightnessCurve: nextParams.lightnessCurve,
          lightnessAxisMin: nextParams.lightnessAxisMin,
          lightnessAxisMax: nextParams.lightnessAxisMax,
          reverse: nextParams.reverse,
        },
      );
      if (solved !== null) {
        onChange({ ...nextParams, start: solved.start, rotations: solved.rotations });
        return;
      }
    }
    onChange(nextParams);
  };
  const update = (key: "chromaPeak" | "chromaWidth" | "chromaFloor") => (value: number) => {
    applyParamsPatch({ [key]: value });
  };
  const setSaturationBoth = ({ min, max }: { min: number; max: number }) => {
    applyParamsPatch({ saturationMin: min, saturationMax: max });
  };
  const paramsAreSplit = params.saturationMin !== params.saturationMax;
  const [userUnlinked, setUserUnlinked] = useState(paramsAreSplit);
  const linked = !userUnlinked && !paramsAreSplit;
  const setLinked = (next: boolean) => {
    if (next) {
      // Linking: average the two values so the gradient stays close to where
      // it was, then both sides match.
      const avg = (params.saturationMin + params.saturationMax) / 2;
      applyParamsPatch({ saturationMin: avg, saturationMax: avg });
      setUserUnlinked(false);
    } else {
      setUserUnlinked(true);
    }
  };
  const minThumbColor = useMemo(() => toCssRgb(cubehelix(0, params)), [params]);
  const maxThumbColor = useMemo(() => toCssRgb(cubehelix(1, params)), [params]);

  // Auto-switch back to freeform when the user directly edits start or
  // rotations. The mode toggle still works for explicit transitions.
  const switchToFreeformAnd = (patch: Partial<CubehelixParams>) => {
    onChange({ ...params, ...patch });
    if (hueAuthoring.mode !== "freeform") {
      onHueAuthoringChange({ mode: "freeform" });
    }
  };
  const setStart = (v: number) => {
    if (!Number.isFinite(v)) return;
    switchToFreeformAnd({ start: mod3(v) });
  };
  const setRotations = (v: number) => {
    switchToFreeformAnd({ rotations: v });
  };

  const solverCtx = {
    lightnessCurve: params.lightnessCurve,
    lightnessAxisMin: params.lightnessAxisMin,
    lightnessAxisMax: params.lightnessAxisMax,
    reverse: params.reverse,
  };

  const enterWaypointMode = () => {
    const ts: [number, number] = [0.25, 0.75];
    const [h1, h2] = huesAtT(params, ts);
    const waypoints: [HueWaypoint, HueWaypoint] = [
      { t: ts[0], hue: h1! },
      { t: ts[1], hue: h2! },
    ];
    const winding = findWindingForRotations(
      waypoints[0],
      waypoints[1],
      params.rotations,
      solverCtx,
    );
    onHueAuthoringChange({ mode: "waypoints", waypoints, winding });
  };

  // When in waypoint mode, any change to the waypoints, winding, or solver
  // context inputs (lightness curve / axis / reverse) re-runs the solver and
  // writes start/rotations back into params.
  const commitWaypointUpdate = (waypoints: [HueWaypoint, HueWaypoint], winding: number) => {
    const solved = solveHueWaypoints(waypoints[0], waypoints[1], winding, solverCtx);
    onHueAuthoringChange({ mode: "waypoints", waypoints, winding });
    if (solved !== null) {
      onChange({ ...params, start: solved.start, rotations: solved.rotations });
    }
  };

  const setWaypoint = (idx: 0 | 1, next: HueWaypoint) => {
    if (hueAuthoring.mode !== "waypoints") return;
    const waypoints: [HueWaypoint, HueWaypoint] = [
      hueAuthoring.waypoints[0],
      hueAuthoring.waypoints[1],
    ];
    waypoints[idx] = next;
    commitWaypointUpdate(waypoints, hueAuthoring.winding);
  };

  const setWinding = (next: number) => {
    if (hueAuthoring.mode !== "waypoints") return;
    commitWaypointUpdate(hueAuthoring.waypoints, next);
  };

  const [remembered, setRemembered] = useState<RememberedCurves>(() =>
    curvesFromParams(params.lightnessCurve),
  );
  const setCurve = (curve: LightnessCurve) => {
    setRemembered((prev) => {
      switch (curve.kind) {
        case "power":
          return { ...prev, power: { gamma: curve.gamma } };
        case "sigmoid":
          return { ...prev, sigmoid: { steepness: curve.steepness, midpoint: curve.midpoint } };
        case "bezier":
          return {
            ...prev,
            bezier: {
              p1: [curve.p1[0], curve.p1[1]] as [number, number],
              p2: [curve.p2[0], curve.p2[1]] as [number, number],
            },
          };
      }
    });
    applyParamsPatch({ lightnessCurve: curve });
  };
  const switchKind = (kind: LightnessCurve["kind"]) => {
    if (params.lightnessCurve.kind === kind) return;
    switch (kind) {
      case "power":
        setCurve({ kind: "power", gamma: remembered.power.gamma });
        break;
      case "sigmoid":
        setCurve({
          kind: "sigmoid",
          steepness: remembered.sigmoid.steepness,
          midpoint: remembered.sigmoid.midpoint,
        });
        break;
      case "bezier":
        setCurve({
          kind: "bezier",
          p1: [remembered.bezier.p1[0], remembered.bezier.p1[1]],
          p2: [remembered.bezier.p2[0], remembered.bezier.p2[1]],
        });
        break;
    }
  };

  const radioName = useId();

  return (
    <>
      <section className="controls">
        <details className="control-section" open>
          <summary className="control-section-header">
            <span className="control-section-title">Hue</span>
            <span className="control-section-chevron" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="control-section-body">
            <div className="hue-mode-toggle" role="radiogroup" aria-label="Hue authoring mode">
              {(["freeform", "waypoints"] as const).map((m) => (
                <label
                  key={m}
                  className={`curve-kind-option ${hueAuthoring.mode === m ? "is-active" : ""}`}
                >
                  <input
                    type="radio"
                    name={`${radioName}-mode`}
                    value={m}
                    checked={hueAuthoring.mode === m}
                    onChange={() => {
                      if (m === "waypoints" && hueAuthoring.mode !== "waypoints") {
                        enterWaypointMode();
                      } else if (m === "freeform" && hueAuthoring.mode !== "freeform") {
                        onHueAuthoringChange({ mode: "freeform" });
                      }
                    }}
                  />
                  <span>{m === "freeform" ? "Freeform" : "Waypoints"}</span>
                </label>
              ))}
            </div>
            {hueAuthoring.mode === "freeform" ? (
              <>
                <div className="hue-control">
                  <div className="hue-control-header">
                    <span className="slider-label">Starting Hue</span>
                    <HelpPopover label="About the starting hue wheel">
                      <p>
                        The wheel sets your gradient&apos;s starting hue, shown at full saturation.
                      </p>
                      <p>
                        You may not see that hue in the gradient itself. By default the gradient
                        starts at black, so it&apos;s hidden at that end. <em>Hue Rotations</em>{" "}
                        also turns the hue as the gradient brightens, shifting the first visible
                        color away from the pointer.
                      </p>
                      <p>
                        Other parameters bend the gradient&apos;s path; they don&apos;t move its
                        start.
                      </p>
                    </HelpPopover>
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
                  <StartingHueWheel value={params.start} onChange={setStart} />
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
                  help={
                    <HelpPopover label="About hue rotations">
                      <p>
                        How many times the hue cycles between the dark and light anchors of the full
                        lightness range, not just the visible window. Negative values turn the other
                        way.
                      </p>
                      <p>
                        The visible palette traverses a sub-arc of that full helix; clipping the{" "}
                        <em>Lightness Axis</em> exposes fewer turns than this number suggests.
                      </p>
                    </HelpPopover>
                  }
                  onChange={setRotations}
                />
              </>
            ) : (
              <>
                <HueWaypointEditor
                  index={1}
                  waypoint={hueAuthoring.waypoints[0]}
                  otherT={hueAuthoring.waypoints[1].t}
                  onChange={(next) => setWaypoint(0, next)}
                />
                <HueWaypointEditor
                  index={2}
                  waypoint={hueAuthoring.waypoints[1]}
                  otherT={hueAuthoring.waypoints[0].t}
                  onChange={(next) => setWaypoint(1, next)}
                />
                <div className="winding-stepper">
                  <span className="slider-label">Winding</span>
                  <HelpPopover label="About winding">
                    <p>
                      The waypoint hues lie on the hue circle, which means there are infinitely many
                      helices that pass through both. Each integer of <em>winding</em> picks a
                      different one — winding 0 takes the shortest path between the two hues; higher
                      values spin through additional full hue cycles.
                    </p>
                  </HelpPopover>
                  <div className="winding-stepper-controls">
                    <button
                      type="button"
                      className="winding-step-button"
                      onClick={() => setWinding(hueAuthoring.winding - 1)}
                      aria-label="Decrease winding"
                    >
                      −
                    </button>
                    <span className="winding-value">
                      {hueAuthoring.winding > 0 ? `+${hueAuthoring.winding}` : hueAuthoring.winding}
                    </span>
                    <button
                      type="button"
                      className="winding-step-button"
                      onClick={() => setWinding(hueAuthoring.winding + 1)}
                      aria-label="Increase winding"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="hue-computed-readout">
                  <span>
                    start = <code>{mod3(params.start).toFixed(3)}</code>
                  </span>
                  <span>
                    rotations = <code>{params.rotations.toFixed(3)}</code>
                  </span>
                </div>
              </>
            )}
          </div>
        </details>
      </section>

      <section className="controls">
        <details className="control-section">
          <summary className="control-section-header">
            <span className="control-section-title">Lightness</span>
            <span className="control-section-chevron" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="control-section-body">
            <div className="curve-control">
              <div className="label-with-help">
                <span className="slider-label">Lightness Curve</span>
                <HelpPopover label="About the lightness curve">
                  <p>
                    Lightness rises from black to white along the helix. This control reshapes how
                    that rise is paced, which stretches or compresses where chroma peaks.
                  </p>
                  <p>
                    <em>Power</em> uses a single gamma exponent. <em>Sigmoid</em> stretches the
                    midtones and compresses the extremes. <em>Bezier</em> exposes two control
                    handles for an arbitrary monotonic curve.
                  </p>
                  <p>
                    The hues on the helix do not change; only the rate at which the visible palette
                    moves through them.
                  </p>
                </HelpPopover>
              </div>
              <div
                className="curve-kind-selector"
                role="radiogroup"
                aria-label="Lightness curve type"
              >
                {(["power", "sigmoid", "bezier"] as const).map((k) => (
                  <label
                    key={k}
                    className={`curve-kind-option ${params.lightnessCurve.kind === k ? "is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name={radioName}
                      value={k}
                      checked={params.lightnessCurve.kind === k}
                      onChange={() => switchKind(k)}
                    />
                    <span>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                  </label>
                ))}
              </div>
              {params.lightnessCurve.kind === "power" && (
                <Slider
                  label="Gamma"
                  technicalName="gamma"
                  value={params.lightnessCurve.gamma}
                  min={0.5}
                  max={2}
                  step={0.01}
                  onChange={(v) => setCurve({ kind: "power", gamma: v })}
                />
              )}
              {params.lightnessCurve.kind === "sigmoid" && (
                <>
                  <Slider
                    label="Steepness"
                    technicalName="sigmoidSteepness"
                    value={params.lightnessCurve.steepness}
                    min={0}
                    max={12}
                    step={0.05}
                    onChange={(v) =>
                      setCurve({
                        kind: "sigmoid",
                        steepness: v,
                        midpoint: (params.lightnessCurve as { midpoint: number }).midpoint,
                      })
                    }
                  />
                  <Slider
                    label="Midpoint"
                    technicalName="sigmoidMidpoint"
                    value={params.lightnessCurve.midpoint}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) =>
                      setCurve({
                        kind: "sigmoid",
                        steepness: (params.lightnessCurve as { steepness: number }).steepness,
                        midpoint: v,
                      })
                    }
                  />
                </>
              )}
              {params.lightnessCurve.kind === "bezier" && (
                <BezierEditor
                  p1={params.lightnessCurve.p1}
                  p2={params.lightnessCurve.p2}
                  onChange={(p1, p2) => setCurve({ kind: "bezier", p1, p2 })}
                />
              )}
            </div>
            <RangeSlider
              label="Lightness Axis"
              technicalNameMin="lightnessAxisMin"
              technicalNameMax="lightnessAxisMax"
              valueMin={params.lightnessAxisMin}
              valueMax={params.lightnessAxisMax}
              min={0}
              max={1}
              step={0.01}
              thumbMinColor={minThumbColor}
              thumbMaxColor={maxThumbColor}
              onChange={({ min: nextMin, max: nextMax }) =>
                applyParamsPatch({ lightnessAxisMin: nextMin, lightnessAxisMax: nextMax })
              }
            />
          </div>
        </details>
      </section>

      <section className="controls">
        <details className="control-section" open>
          <summary className="control-section-header">
            <span className="control-section-title">Chroma</span>
            <span className="control-section-chevron" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="control-section-body">
            <div className="saturation-block">
              <span className="saturation-block-label">Saturation</span>
              <SaturationField
                params={params}
                saturationMin={params.saturationMin}
                saturationMax={params.saturationMax}
                linked={linked}
                max={SATURATION_SLIDER_MAX}
                scaleExponent={3}
                step={0.01}
                onChange={setSaturationBoth}
                onLinkedChange={setLinked}
              />
            </div>
            <Slider
              label="Peak Position"
              technicalName="chromaPeak"
              value={params.chromaPeak}
              min={CHROMA_PEAK_BOUNDS.min}
              max={CHROMA_PEAK_BOUNDS.max}
              step={0.01}
              help={
                <HelpPopover label="About peak position">
                  <p>
                    The lightness at which chroma is most saturated. Default 0.5 puts the most vivid
                    colors in the midtones. Lower values shift the chroma peak into the shadows;
                    higher values shift it into the highlights.
                  </p>
                </HelpPopover>
              }
              onChange={update("chromaPeak")}
            />
            <Slider
              label="Chroma Width"
              technicalName="chromaWidth"
              value={params.chromaWidth}
              min={CHROMA_WIDTH_BOUNDS.min}
              max={CHROMA_WIDTH_BOUNDS.max}
              step={0.01}
              scaleExponent={2}
              help={
                <HelpPopover label="About chroma width">
                  <p>
                    How sharply chroma falls off away from the peak. Small values give a narrow band
                    of high saturation around the peak with muted endpoints; large values spread
                    saturation broadly across the palette.
                  </p>
                </HelpPopover>
              }
              onChange={update("chromaWidth")}
            />
            <Slider
              label="Chroma Floor"
              technicalName="chromaFloor"
              value={params.chromaFloor}
              min={CHROMA_FLOOR_BOUNDS.min}
              max={CHROMA_FLOOR_BOUNDS.max}
              step={0.01}
              help={
                <HelpPopover label="About chroma floor">
                  <p>
                    Lifts the chroma envelope at the dark and light endpoints. Default 0 makes the
                    palette anchor at pure black and pure white. Raise this to keep some color in
                    the shadows and highlights instead of running all the way to the cube corners.
                  </p>
                </HelpPopover>
              }
              onChange={update("chromaFloor")}
            />
          </div>
        </details>
      </section>

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
    </>
  );
}
