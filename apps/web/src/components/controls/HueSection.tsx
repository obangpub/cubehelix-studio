import { useId, useState } from "react";
import { MAX_ROTATIONS, type CubehelixParams, type HueWaypoint } from "@cubehelix-studio/core";
import { useAnnounce } from "../../lib/announcer";
import { clamp, mod } from "../../lib/math";
import type { HueAuthoringState } from "../../lib/url-state";
import { HelpPopover } from "../HelpPopover";
import { HueDualWheel } from "../HueDualWheel";
import { HueWavePlot } from "../HueWavePlot";
import { Slider } from "../Slider";
import { StartingHueWheel } from "../StartingHueWheel";
import type { WaypointSolution } from "./useHueAuthoring";

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
  // Which waypoint the wave plot and dual wheel edit. Tier 3 ephemeral
  // selection state: component-local, re-seeded to 0 when ParamControls
  // remounts on Reset.
  const [activeWaypoint, setActiveWaypoint] = useState<0 | 1>(0);
  const posInputId = useId();
  const hueInputId = useId();

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
          <span className="control-section-title-group">
            <span className="control-section-title">Hue</span>
            {/* The popover trigger sits inside the <summary>, so swallow its
                click to keep it from toggling the section open/closed. */}
            <span
              className="control-section-help"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <HelpPopover label="About the Hue section">
                <p>
                  The Hue section controls which hues your palette runs through, from its darkest
                  color to its lightest. As the palette brightens, its hue turns around the color
                  wheel; this section sets where that turn starts and how far it goes. The mode
                  toggle chooses how you set it.
                </p>
                <p>
                  <em>Freeform</em>: pick a starting hue on the wheel, then use{" "}
                  <em>Hue Rotations</em> to set how far the hue turns as the palette brightens. One
                  rotation is a full trip around the wheel.
                </p>
                <p>
                  <em>Waypoints</em>: pin two hues at two points along the palette, and the app
                  works out the starting hue and rotations that pass through both.
                </p>
                <p>
                  The wheel is a recipe, not a preview. A hue you choose may not appear in the
                  palette exactly as it looks on the wheel: palette colors are usually darker and
                  less saturated than the wheel&apos;s pure swatches, and the starting hue sits at
                  the dark end, where the palette begins at black.
                </p>
              </HelpPopover>
            </span>
          </span>
          <span className="control-section-chevron" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="control-section-body">
          <div className="segmented" role="radiogroup" aria-label="Hue authoring mode">
            {(["freeform", "waypoints"] as const).map((m) => (
              <label
                key={m}
                className={`segmented-option ${hueAuthoring.mode === m ? "is-active" : ""}`}
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
                numberMin={-MAX_ROTATIONS}
                numberMax={MAX_ROTATIONS}
                help={
                  <HelpPopover label="About hue rotations">
                    <p>
                      How many full turns the hue makes between pure black and pure white. Negative
                      values turn the other way.
                    </p>
                    <p>
                      The palette you see covers only part of that sweep, so narrowing the{" "}
                      <em>Lightness Axis</em> shows fewer turns than this number.
                    </p>
                  </HelpPopover>
                }
                onChange={setRotations}
              />
            </>
          ) : (
            <>
              <HueWavePlot
                params={params}
                waypoints={hueAuthoring.waypoints}
                activeIndex={activeWaypoint}
                solved={waypointSolved !== null}
                onActiveChange={setActiveWaypoint}
                onPositionChange={(idx, t) =>
                  setWaypoint(idx, { ...hueAuthoring.waypoints[idx], t })
                }
              />
              <HueDualWheel
                waypoints={hueAuthoring.waypoints}
                activeIndex={activeWaypoint}
                onActiveChange={setActiveWaypoint}
                onHueChange={(idx, hue) =>
                  setWaypoint(idx, { ...hueAuthoring.waypoints[idx], hue })
                }
              />
              <div className="hue-waypoint-fields">
                <span className="hue-waypoint-header">Waypoint {activeWaypoint + 1}</span>
                <div className="hue-waypoint-field">
                  <label htmlFor={posInputId} className="slider-label">
                    Position
                  </label>
                  <input
                    id={posInputId}
                    className="slider-value"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={Number(hueAuthoring.waypoints[activeWaypoint].t.toFixed(3))}
                    onChange={(e) => {
                      const v = e.currentTarget.valueAsNumber;
                      if (!Number.isFinite(v)) return;
                      setWaypoint(activeWaypoint, {
                        ...hueAuthoring.waypoints[activeWaypoint],
                        t: clamp(v, 0, 1),
                      });
                    }}
                  />
                </div>
                <div className="hue-waypoint-field">
                  <label htmlFor={hueInputId} className="slider-label">
                    Hue
                  </label>
                  <input
                    id={hueInputId}
                    className="slider-value"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={Number(hueAuthoring.waypoints[activeWaypoint].hue.toFixed(3))}
                    onChange={(e) => {
                      const v = e.currentTarget.valueAsNumber;
                      if (!Number.isFinite(v)) return;
                      setWaypoint(activeWaypoint, {
                        ...hueAuthoring.waypoints[activeWaypoint],
                        hue: mod(v, 1),
                      });
                    }}
                  />
                </div>
              </div>
              <div className="winding-stepper">
                <span className="slider-label">Winding</span>
                <HelpPopover label="About winding">
                  <p>
                    The waypoint hues lie on the hue circle, which means there are infinitely many
                    helices that pass through both. Each integer of <em>winding</em> picks a
                    different one — winding 0 takes the shortest path between the two hues; higher
                    values spin through additional full hue cycles. Watch the wave plot gain or lose
                    wiggles as you step.
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
                  No helix can pass through both of these hues within the current lightness axis.
                  Widen the axis, or switch to Freeform.
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
