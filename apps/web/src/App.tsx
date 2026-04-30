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

export default function App() {
  const [state, setState] = useUrlParams();
  const { params, swatchCount } = state;

  const setParams = (next: CubehelixParams | ((prev: CubehelixParams) => CubehelixParams)) => {
    setState((prev) => ({
      ...prev,
      params: typeof next === "function" ? next(prev.params) : next,
    }));
  };
  const setSwatchCount = (next: number) => {
    setState((prev) => ({ ...prev, swatchCount: next }));
  };

  return (
    <main className="app">
      <header>
        <div className="header-titles">
          <h1>Cubehelix Studio</h1>
          <p>Build a cubehelix palette that holds up in grayscale, colorblindness, and print.</p>
        </div>
        <div className="header-actions">
          <ShareLink />
          <AboutDialog />
        </div>
      </header>
      <div className="layout">
        <section className="visualization" aria-label="Palette preview">
          <CubeVisualization params={params} />
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
