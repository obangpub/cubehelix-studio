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
  const [params, setParams] = useUrlParams();
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
        <div className="layout-left">
          <ParamControls params={params} onChange={setParams} />
          <section className="preview" aria-label="Palette preview">
            <GradientStrip params={params} />
            <SwatchRow params={params} />
          </section>
        </div>
        <section className="visualization" aria-label="Cube and gamma visualization">
          <CubeVisualization params={params} />
          <GammaBar params={params} />
        </section>
      </div>
      <ExportPanel params={params} />
    </main>
  );
}
