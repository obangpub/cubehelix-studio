import { useId, useMemo, useState } from "react";
import {
  cubehelix,
  DEFAULT_BEZIER_P1,
  DEFAULT_BEZIER_P2,
  DEFAULT_POWER_GAMMA,
  DEFAULT_SIGMOID_MIDPOINT,
  DEFAULT_SIGMOID_STEEPNESS,
  saturationCap,
  toCssRgb,
  type CubehelixParams,
  type LightnessCurve,
} from "@cubehelix-studio/core";
import {
  CHROMA_FLOOR_BOUNDS,
  CHROMA_PEAK_BOUNDS,
  CHROMA_WIDTH_BOUNDS,
  SWATCH_COUNT_BOUNDS,
} from "../lib/url-state";
import { BezierEditor } from "./BezierEditor";
import { RangeSlider } from "./RangeSlider";
import { Slider } from "./Slider";
import { StartingHueWheel } from "./StartingHueWheel";

function mod3(v: number): number {
  return ((v % 3) + 3) % 3;
}

interface ParamControlsProps {
  params: CubehelixParams;
  onChange: (params: CubehelixParams) => void;
  swatchCount: number;
  onSwatchCountChange: (count: number) => void;
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
}: ParamControlsProps) {
  const update =
    (key: "rotations" | "saturation" | "chromaPeak" | "chromaWidth" | "chromaFloor") =>
    (value: number) => {
      onChange({ ...params, [key]: value });
    };
  const minThumbColor = useMemo(() => toCssRgb(cubehelix(0, params)), [params]);
  const maxThumbColor = useMemo(() => toCssRgb(cubehelix(1, params)), [params]);
  const saturationMax = useMemo(() => {
    const SAMPLES = 24;
    let max = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const start = (i / SAMPLES) * 3;
      const cap = saturationCap({ ...params, start });
      if (cap > max) max = cap;
    }
    return Number(max.toFixed(2));
  }, [
    params.rotations,
    params.lightnessCurve,
    params.lightnessMin,
    params.lightnessMax,
    params.chromaPeak,
    params.chromaWidth,
    params.chromaFloor,
    params.reverse,
  ]);
  const setStart = (v: number) => {
    if (!Number.isFinite(v)) return;
    onChange({ ...params, start: mod3(v) });
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
    onChange({ ...params, lightnessCurve: curve });
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
    <section className="controls">
      <details className="control-section" open>
        <summary className="control-section-header">
          <span className="control-section-title">Classic</span>
          <span className="control-section-chevron" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="control-section-body">
          <div className="hue-control">
            <div className="hue-control-header">
              <span className="slider-titles">
                <span className="slider-label">Starting Hue</span>
                <span className="slider-technical">start</span>
              </span>
              <details className="info-popover">
                <summary
                  className="info-popover-trigger"
                  aria-label="About the starting hue wheel"
                  title="About the starting hue wheel"
                >
                  ?
                </summary>
                <div className="info-popover-content" role="tooltip">
                  <p>
                    The wheel pointer indicates the hue at <em>t = 0</em> of your gradient — the
                    mathematical starting hue.
                  </p>
                  <p>
                    With the default lightness range, the gradient starts at black, so this hue is
                    not directly visible at the start. The first <em>visible</em> color also depends
                    on <em>Hue Rotations</em>, which sweeps the helix through other hues as it
                    traverses the lightness ramp.
                  </p>
                  <p>
                    The wheel itself is a pure-hue picker: each segment is rendered at peak chroma
                    independent of your rotation count, so the pointer always points at the same
                    family for a given <em>start</em>.
                  </p>
                </div>
              </details>
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
            onChange={update("rotations")}
          />
          <Slider
            label="Saturation"
            technicalName="saturation"
            value={params.saturation}
            min={0}
            max={saturationMax}
            step={0.01}
            scaleExponent={3}
            onChange={update("saturation")}
          />
        </div>
      </details>

      <details className="control-section" open>
        <summary className="control-section-header">
          <span className="control-section-title">Lightness</span>
          <span className="control-section-chevron" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="control-section-body">
          <div className="curve-control">
            <div className="slider-titles">
              <span className="slider-label">Lightness Curve</span>
              <span className="slider-technical">lightnessCurve</span>
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
            label="Lightness Range"
            technicalNameMin="lightnessMin"
            technicalNameMax="lightnessMax"
            valueMin={params.lightnessMin}
            valueMax={params.lightnessMax}
            min={0}
            max={1}
            step={0.01}
            thumbMinColor={minThumbColor}
            thumbMaxColor={maxThumbColor}
            onChange={({ min: nextMin, max: nextMax }) =>
              onChange({ ...params, lightnessMin: nextMin, lightnessMax: nextMax })
            }
          />
        </div>
      </details>

      <details className="control-section">
        <summary className="control-section-header">
          <span className="control-section-title">Chroma</span>
          <span className="control-section-chevron" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="control-section-body">
          <Slider
            label="Chroma Peak"
            technicalName="chromaPeak"
            value={params.chromaPeak}
            min={CHROMA_PEAK_BOUNDS.min}
            max={CHROMA_PEAK_BOUNDS.max}
            step={0.01}
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
            onChange={update("chromaWidth")}
          />
          <Slider
            label="Chroma Floor"
            technicalName="chromaFloor"
            value={params.chromaFloor}
            min={CHROMA_FLOOR_BOUNDS.min}
            max={CHROMA_FLOOR_BOUNDS.max}
            step={0.01}
            onChange={update("chromaFloor")}
          />
        </div>
      </details>

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
              onChange={(e) => onChange({ ...params, reverse: e.currentTarget.checked })}
            />
            <span className="slider-titles">
              <span className="slider-label">Reverse</span>
              <span className="slider-technical">reverse</span>
            </span>
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
  );
}
