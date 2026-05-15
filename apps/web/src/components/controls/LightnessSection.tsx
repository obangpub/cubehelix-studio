import { useId, useMemo } from "react";
import {
  cubehelix,
  toCssRgb,
  type CubehelixParams,
  type LightnessCurve,
} from "@cubehelix-studio/core";
import { BezierEditor } from "../BezierEditor";
import { HelpPopover } from "../HelpPopover";
import { RangeSlider } from "../RangeSlider";
import { Slider } from "../Slider";

interface LightnessSectionProps {
  params: CubehelixParams;
  applyParamsPatch: (patch: Partial<CubehelixParams>) => void;
  setCurve: (curve: LightnessCurve) => void;
  switchKind: (kind: LightnessCurve["kind"]) => void;
}

export function LightnessSection({
  params,
  applyParamsPatch,
  setCurve,
  switchKind,
}: LightnessSectionProps) {
  const radioName = useId();
  const minThumbColor = useMemo(() => toCssRgb(cubehelix(0, params)), [params]);
  const maxThumbColor = useMemo(() => toCssRgb(cubehelix(1, params)), [params]);
  // A const binding lets TypeScript carry the kind narrowing into the onChange
  // closures below, so the curve-specific fields need no casts.
  const curve = params.lightnessCurve;

  return (
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
                  midtones and compresses the extremes. <em>Bezier</em> exposes two control handles
                  for an arbitrary monotonic curve.
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
                  className={`curve-kind-option ${curve.kind === k ? "is-active" : ""}`}
                >
                  <input
                    type="radio"
                    name={radioName}
                    value={k}
                    checked={curve.kind === k}
                    onChange={() => switchKind(k)}
                  />
                  <span>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                </label>
              ))}
            </div>
            {curve.kind === "power" && (
              <Slider
                label="Gamma"
                technicalName="gamma"
                value={curve.gamma}
                min={0.5}
                max={2}
                step={0.01}
                onChange={(v) => setCurve({ kind: "power", gamma: v })}
              />
            )}
            {curve.kind === "sigmoid" && (
              <>
                <Slider
                  label="Steepness"
                  technicalName="sigmoidSteepness"
                  value={curve.steepness}
                  min={0}
                  max={12}
                  step={0.05}
                  onChange={(v) =>
                    setCurve({ kind: "sigmoid", steepness: v, midpoint: curve.midpoint })
                  }
                />
                <Slider
                  label="Midpoint"
                  technicalName="sigmoidMidpoint"
                  value={curve.midpoint}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) =>
                    setCurve({ kind: "sigmoid", steepness: curve.steepness, midpoint: v })
                  }
                />
              </>
            )}
            {curve.kind === "bezier" && (
              <BezierEditor
                p1={curve.p1}
                p2={curve.p2}
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
  );
}
