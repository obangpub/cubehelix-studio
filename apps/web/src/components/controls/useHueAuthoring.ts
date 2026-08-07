import { useMemo } from "react";
import {
  findWindingForRotations,
  huesAtT,
  solveHueWaypoints,
  type CubehelixParams,
  type HueWaypoint,
} from "@cubehelix-studio/core";
import type { HueAuthoringState } from "../../lib/url-state";

/** The (start, rotations) pair the waypoint solver resolves to, or null when
 *  the waypoints are degenerate. */
export type WaypointSolution = ReturnType<typeof solveHueWaypoints>;

/**
 * Owns the hue-authoring orchestration: applying parameter patches while
 * keeping waypoint mode solved, and the waypoint editors' read/write API.
 */
export function useHueAuthoring(
  params: CubehelixParams,
  onChange: (params: CubehelixParams) => void,
  hueAuthoring: HueAuthoringState,
  onHueAuthoringChange: (next: HueAuthoringState) => void,
) {
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

  const solverCtx = useMemo(
    () => ({
      lightnessCurve: params.lightnessCurve,
      lightnessAxisMin: params.lightnessAxisMin,
      lightnessAxisMax: params.lightnessAxisMax,
      reverse: params.reverse,
    }),
    [params.lightnessCurve, params.lightnessAxisMin, params.lightnessAxisMax, params.reverse],
  );

  const enterWaypointMode = () => {
    const ts: [number, number] = [0.25, 0.75];
    const [h1, h2] = huesAtT(params, ts);
    const waypoints: [HueWaypoint, HueWaypoint] = [
      { t: ts[0], hue: h1! },
      { t: ts[1], hue: h2! },
    ];
    // Seed winding so entering waypoint mode reproduces the current freeform
    // palette exactly. From there the winding stepper lets the user step
    // between solutions — each integer is a different turn count through the
    // same two pinned hues.
    const winding = findWindingForRotations(
      waypoints[0],
      waypoints[1],
      params.rotations,
      solverCtx,
    );
    onHueAuthoringChange({ mode: "waypoints", waypoints, winding });
  };

  // When in waypoint mode, any change to the waypoints or solver context inputs
  // (lightness curve / axis / reverse) re-runs the solver and writes
  // start/rotations back into params. Winding is the value seeded on mode entry
  // and is carried through unchanged.
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

  // Step between solver solutions: each integer winding picks a different
  // helix through the same two pinned hues, changing the rotation count.
  const setWinding = (next: number) => {
    if (hueAuthoring.mode !== "waypoints") return;
    commitWaypointUpdate(hueAuthoring.waypoints, next);
  };

  // Whether the current waypoints resolve to a (start, rotations) pair. Null
  // means a degenerate config (e.g. a collapsed lightness axis makes the two
  // waypoint u-values coincide); the UI surfaces this instead of silently
  // leaving start/rotations stale. Memoized so the solver does not re-run on
  // unrelated renders.
  const waypointSolved = useMemo(
    () =>
      hueAuthoring.mode === "waypoints"
        ? solveHueWaypoints(
            hueAuthoring.waypoints[0],
            hueAuthoring.waypoints[1],
            hueAuthoring.winding,
            solverCtx,
          )
        : null,
    [hueAuthoring, solverCtx],
  );

  return { applyParamsPatch, enterWaypointMode, setWaypoint, setWinding, waypointSolved };
}
