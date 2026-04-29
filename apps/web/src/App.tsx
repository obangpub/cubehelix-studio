import { useState } from "react";
import { DEFAULT_CUBEHELIX_PARAMS, type CubehelixParams } from "@cubehelix-studio/core";
import { CubeVisualization } from "./components/CubeVisualization";
import { GammaBar } from "./components/GammaBar";
import { GradientStrip } from "./components/GradientStrip";
import { ParamControls } from "./components/ParamControls";
import { SwatchRow } from "./components/SwatchRow";

export default function App() {
  const [params, setParams] = useState<CubehelixParams>(DEFAULT_CUBEHELIX_PARAMS);
  return (
    <main className="app">
      <header>
        <h1>Cubehelix Studio</h1>
        <p>Build a cubehelix palette that holds up in grayscale, colorblindness, and print.</p>
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
    </main>
  );
}
