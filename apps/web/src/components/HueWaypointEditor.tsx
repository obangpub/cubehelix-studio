import { useId } from "react";
import type { HueWaypoint } from "@cubehelix-studio/core";
import { Slider } from "./Slider";
import { StartingHueWheel } from "./StartingHueWheel";

// Minimum separation in palette-t space between the two waypoints. Keeps
// u₁ ≈ u₂ from collapsing the solver to a degenerate case.
export const WAYPOINT_T_MIN_SEPARATION = 0.05;

function mod1(v: number): number {
  return ((v % 1) + 1) % 1;
}

interface HueWaypointEditorProps {
  index: 1 | 2;
  waypoint: HueWaypoint;
  otherT: number;
  onChange: (next: HueWaypoint) => void;
}

export function HueWaypointEditor({ index, waypoint, otherT, onChange }: HueWaypointEditorProps) {
  const tBound =
    index === 1
      ? { min: 0, max: Math.max(0, otherT - WAYPOINT_T_MIN_SEPARATION) }
      : { min: Math.min(1, otherT + WAYPOINT_T_MIN_SEPARATION), max: 1 };
  const hueNumberId = useId();
  const label = `Waypoint ${index}`;

  return (
    <div className="hue-waypoint-editor">
      <div className="hue-waypoint-header">{label}</div>
      <Slider
        label="Position"
        technicalName={`waypoint${index}t`}
        value={waypoint.t}
        min={tBound.min}
        max={tBound.max}
        step={0.01}
        onChange={(t) => onChange({ ...waypoint, t })}
      />
      <div className="hue-waypoint-hue">
        <div className="hue-waypoint-hue-header">
          <span className="slider-label">Hue</span>
          <input
            id={hueNumberId}
            className="slider-value"
            type="number"
            value={Number(waypoint.hue.toFixed(3))}
            step={0.01}
            min={0}
            max={1}
            onChange={(e) => {
              const v = e.target.valueAsNumber;
              if (!Number.isFinite(v)) return;
              onChange({ ...waypoint, hue: mod1(v) });
            }}
            aria-label={`${label} hue value`}
          />
        </div>
        <StartingHueWheel
          value={waypoint.hue * 3}
          ariaLabel={`${label} hue`}
          compact
          onChange={(startVal) => onChange({ ...waypoint, hue: mod1(startVal / 3) })}
        />
      </div>
    </div>
  );
}
