import { useState } from "react";
import type { CubehelixParams } from "@cubehelix-studio/core";
import { AboutDialog } from "./components/AboutDialog";
import { CubeVisualization } from "./components/CubeVisualization";
import { ExportPanel } from "./components/ExportPanel";
import { GammaBar } from "./components/GammaBar";
import { GradientStrip } from "./components/GradientStrip";
import { ParamControls } from "./components/ParamControls";
import { ShareLink } from "./components/ShareLink";
import { SwatchRow } from "./components/SwatchRow";
import { useUrlParams } from "./hooks/useUrlParams";
import { DEFAULT_APP_STATE } from "./lib/url-state";

export default function App() {
  const [state, setState] = useUrlParams();
  const { params, swatchCount } = state;
  const [resetSignal, setResetSignal] = useState(0);

  const setParams = (next: CubehelixParams | ((prev: CubehelixParams) => CubehelixParams)) => {
    setState((prev) => ({
      ...prev,
      params: typeof next === "function" ? next(prev.params) : next,
    }));
  };
  const setSwatchCount = (next: number) => {
    setState((prev) => ({ ...prev, swatchCount: next }));
  };
  const handleReset = () => {
    setState(DEFAULT_APP_STATE);
    setResetSignal((n) => n + 1);
  };

  return (
    <main className="app">
      <header>
        <div className="header-titles">
          <h1>Cubehelix Studio</h1>
          <p>Build a cubehelix palette that holds up in grayscale, colorblindness, and print.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="header-button" onClick={handleReset}>
            Reset
          </button>
          <ShareLink />
          <AboutDialog />
        </div>
      </header>
      <div className="layout">
        <section className="visualization" aria-label="Palette preview">
          <CubeVisualization params={params} resetSignal={resetSignal} />
          <GradientStrip params={params} />
          <GammaBar params={params} />
          <SwatchRow params={params} count={swatchCount} />
        </section>
        <div className="layout-controls">
          <ParamControls
            params={params}
            onChange={setParams}
            swatchCount={swatchCount}
            onSwatchCountChange={setSwatchCount}
          />
        </div>
      </div>
      <ExportPanel params={params} swatchCount={swatchCount} />
    </main>
  );
}
