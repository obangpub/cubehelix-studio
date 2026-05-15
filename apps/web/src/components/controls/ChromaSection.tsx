import { useState } from "react";
import type { CubehelixParams } from "@cubehelix-studio/core";
import { CHROMA_FLOOR_BOUNDS, CHROMA_PEAK_BOUNDS, CHROMA_WIDTH_BOUNDS } from "../../lib/url-state";
import { HelpPopover } from "../HelpPopover";
import { SaturationField } from "../SaturationField";
import { Slider } from "../Slider";

// Saturation tops out well past full-gamut so users can intentionally crank
// past the in-gamut range. The quadratic scale (scaleExponent=2 on the
// saturation field) puts the most-used 0..2 range across the lower ~67% of
// travel, leaving the upper portion for the rare 2..4.5 territory.
const SATURATION_SLIDER_MAX = 4.5;

interface ChromaSectionProps {
  params: CubehelixParams;
  applyParamsPatch: (patch: Partial<CubehelixParams>) => void;
}

export function ChromaSection({ params, applyParamsPatch }: ChromaSectionProps) {
  const setSaturationBoth = ({ min, max }: { min: number; max: number }) => {
    applyParamsPatch({ saturationMin: min, saturationMax: max });
  };
  const update = (key: "chromaPeak" | "chromaWidth" | "chromaFloor") => (value: number) => {
    applyParamsPatch({ [key]: value });
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

  return (
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
              scaleExponent={2}
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
                  palette anchor at pure black and pure white. Raise this to keep some color in the
                  shadows and highlights instead of running all the way to the cube corners.
                </p>
              </HelpPopover>
            }
            onChange={update("chromaFloor")}
          />
        </div>
      </details>
    </section>
  );
}
