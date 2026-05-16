import { useId } from "react";
import type { CubehelixParams, HueWaypoint } from "@cubehelix-studio/core";
import { useAnnounce } from "../../lib/announcer";
import { mod } from "../../lib/math";
import type { HueAuthoringState } from "../../lib/url-state";
import { HelpPopover } from "../HelpPopover";
import { HueWaypointEditor } from "../HueWaypointEditor";
import { Slider } from "../Slider";
import { StartingHueWheel } from "../StartingHueWheel";
import type { WaypointSolution } from "./useHueAuthoring";

// The Hue Rotations slider sweeps -3..3, but the number input may exceed that.
// Cap it well past any practical palette so a typed or pasted extreme value
// can't drive the cube viz into an unbounded geometry rebuild.
const ROTATIONS_NUMBER_LIMIT = 50;

interface HueSectionProps {
  params: CubehelixParams;
  onChange: (params: CubehelixParams) => void;
  hueAuthoring: HueAuthoringState;
  onHueAuthoringChange: (next: HueAuthoringState) => void;
  enterWaypointMode: () => void;
  setWaypoint: (idx: 0 | 1, next: HueWaypoint) => void;
  setWinding: (next: number) => void;
  waypointSolved: WaypointSolution;
}

export function HueSection({
  params,
  onChange,
  hueAuthoring,
  onHueAuthoringChange,
  enterWaypointMode,
  setWaypoint,
  setWinding,
  waypointSolved,
}: HueSectionProps) {
  const announce = useAnnounce();
  const modeRadioName = useId();

  // The Starting Hue wheel and Hue Rotations slider only render in freeform
  // mode, so these setters always run with mode already "freeform".
  const setStart = (v: number) => {
    if (!Number.isFinite(v)) return;
    onChange({ ...params, start: mod(v, 3) });
  };
  const setRotations = (v: number) => {
    onChange({ ...params, rotations: v });
  };

  return (
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
                  name={`${modeRadioName}-mode`}
                  value={m}
                  checked={hueAuthoring.mode === m}
                  onChange={() => {
                    if (m === "waypoints" && hueAuthoring.mode !== "waypoints") {
                      enterWaypointMode();
                      announce("Hue mode: Waypoints");
                    } else if (m === "freeform" && hueAuthoring.mode !== "freeform") {
                      onHueAuthoringChange({ mode: "freeform" });
                      announce("Hue mode: Freeform");
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
                      starts at black, so it&apos;s hidden at that end. <em>Hue Rotations</em> also
                      turns the hue as the gradient brightens, shifting the first visible color away
                      from the pointer.
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
                    value={Number(mod(params.start, 3).toFixed(3))}
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
                numberMin={-ROTATIONS_NUMBER_LIMIT}
                numberMax={ROTATIONS_NUMBER_LIMIT}
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
              {waypointSolved === null ? (
                <p className="hue-waypoint-warning" role="status">
                  These waypoints can&apos;t resolve with the current lightness axis — widen the
                  axis or switch to Freeform.
                </p>
              ) : (
                <div className="hue-computed-readout">
                  <span>
                    start = <code>{mod(params.start, 3).toFixed(3)}</code>
                  </span>
                  <span>
                    rotations = <code>{params.rotations.toFixed(3)}</code>
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </details>
    </section>
  );
}
