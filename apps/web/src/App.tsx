import { useEffect, useState } from "react";
import type { CubehelixParams } from "@cubehelix-studio/core";
import { AboutDialog } from "./components/AboutDialog";
import { CubeVisualization } from "./components/CubeVisualization";
import { ExportPanel } from "./components/ExportPanel";
import { GammaBar } from "./components/GammaBar";
import { GradientStrip } from "./components/GradientStrip";
import { ParamControls } from "./components/ParamControls";
import { PresetGallery } from "./components/PresetGallery";
import { ShareLink } from "./components/ShareLink";
import { SwatchRow } from "./components/SwatchRow";
import { useUrlParams } from "./hooks/useUrlParams";
import { DEFAULT_APP_STATE } from "./lib/url-state";

export type Theme = "light" | "dark";

const APP_THEME_KEY = "cubehelix-studio:appTheme";
const CUBE_THEME_KEY = "cubehelix-studio:cubeTheme";

function readStoredTheme(key: string): Theme | null {
  try {
    const v = localStorage.getItem(key);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* localStorage unavailable */
  }
  return null;
}

function writeStoredTheme(key: string, value: Theme): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* localStorage unavailable */
  }
}

function detectSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [state, setState] = useUrlParams();
  const { params, swatchCount } = state;
  const [resetSignal, setResetSignal] = useState(0);
  const [appTheme, setAppThemeState] = useState<Theme>(
    () => readStoredTheme(APP_THEME_KEY) ?? detectSystemTheme(),
  );
  const [cubeTheme, setCubeThemeState] = useState<Theme>(
    () => readStoredTheme(CUBE_THEME_KEY) ?? "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = appTheme;
  }, [appTheme]);

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
  const toggleAppTheme = () => {
    const next: Theme = appTheme === "light" ? "dark" : "light";
    setAppThemeState(next);
    writeStoredTheme(APP_THEME_KEY, next);
    // Master toggle cascades into the cube viz so the whole app moves together.
    setCubeThemeState(next);
    writeStoredTheme(CUBE_THEME_KEY, next);
  };
  const setCubeTheme = (next: Theme) => {
    setCubeThemeState(next);
    writeStoredTheme(CUBE_THEME_KEY, next);
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
          <button
            type="button"
            className="header-icon-button"
            onClick={toggleAppTheme}
            aria-label={appTheme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            title={appTheme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {appTheme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
          <ShareLink />
          <AboutDialog />
        </div>
      </header>
      <div className="layout">
        <section className="visualization" aria-label="Palette preview">
          <CubeVisualization
            params={params}
            resetSignal={resetSignal}
            cubeTheme={cubeTheme}
            onCubeThemeChange={setCubeTheme}
          />
          <GradientStrip params={params} />
          <GammaBar params={params} />
          <SwatchRow params={params} count={swatchCount} />
        </section>
        <div className="layout-controls">
          <PresetGallery onSelect={setParams} />
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

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
        <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
        <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
        <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
      </g>
    </svg>
  );
}
