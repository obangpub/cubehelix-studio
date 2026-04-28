import { useState } from "react";
import { DEFAULT_CUBEHELIX_PARAMS, type CubehelixParams } from "@lumenfast/core";
import { ParamControls } from "./components/ParamControls";

export default function App() {
  const [params, setParams] = useState<CubehelixParams>(DEFAULT_CUBEHELIX_PARAMS);
  return (
    <main className="app">
      <header>
        <h1>lumenfast</h1>
        <p>Perceptually-honest color palettes from cubehelix.</p>
      </header>
      <ParamControls params={params} onChange={setParams} />
      <pre className="params-debug">{JSON.stringify(params, null, 2)}</pre>
    </main>
  );
}
