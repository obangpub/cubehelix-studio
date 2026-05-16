import { useState } from "react";
import {
  DEFAULT_BEZIER_P1,
  DEFAULT_BEZIER_P2,
  DEFAULT_POWER_GAMMA,
  DEFAULT_SIGMOID_MIDPOINT,
  DEFAULT_SIGMOID_STEEPNESS,
  type CubehelixParams,
  type LightnessCurve,
} from "@cubehelix-studio/core";

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

/**
 * Remembers the per-kind lightness-curve settings so switching curve kind and
 * switching back restores the previous values rather than resetting them.
 */
export function useRememberedCurves(
  lightnessCurve: LightnessCurve,
  applyParamsPatch: (patch: Partial<CubehelixParams>) => void,
) {
  const [remembered, setRemembered] = useState<RememberedCurves>(() =>
    curvesFromParams(lightnessCurve),
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
    if (lightnessCurve.kind === kind) return;
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

  return { setCurve, switchKind };
}
