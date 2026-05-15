import { useEffect, useState } from "react";
import type { CubehelixParams, PreviewMode } from "@cubehelix-studio/core";
import { AboutDialog } from "./components/AboutDialog";
import { CubeVisualization } from "./components/CubeVisualization";
import { ExportPanel } from "./components/ExportPanel";
import { GammaBar } from "./components/GammaBar";
import { GradientStrip } from "./components/GradientStrip";
import { ParamControls } from "./components/ParamControls";
import { PresetGallery } from "./components/PresetGallery";
import { PreviewControl } from "./components/PreviewControl";
import { ShareLink } from "./components/ShareLink";
import { SwatchRow } from "./components/SwatchRow";
import { useUrlParams } from "./hooks/useUrlParams";
import { AnnouncerProvider, useAnnounce } from "./lib/announcer";
import { DEFAULT_APP_STATE, type HueAuthoringState } from "./lib/url-state";

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
  return (
    <AnnouncerProvider>
      <AppInner />
    </AnnouncerProvider>
  );
}

function AppInner() {
  const announce = useAnnounce();
  const [state, setState] = useUrlParams();
  const { params, swatchCount, hueAuthoring } = state;
  const [resetSignal, setResetSignal] = useState(0);
  // Bumped on preset load to remount ParamControls (clearing its Tier 3 state —
  // userUnlinked, remembered curves) without disturbing the cube camera, which
  // a full resetSignal pulse would.
  const [presetEpoch, setPresetEpoch] = useState(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("normal");
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
  const setHueAuthoring = (next: HueAuthoringState) => {
    setState((prev) => ({ ...prev, hueAuthoring: next }));
  };
  // Reset clears Tier 1 / document state (DEFAULT_APP_STATE) and pulses
  // resetSignal so Tier 3 / ephemeral widget state re-seeds from the cleared
  // palette. It deliberately leaves Tier 2 / workspace preferences alone
  // (appTheme, cubeTheme, previewMode) — Reset starts a new palette, not a new
  // workspace. See the AppState comment in lib/url-state.ts.
  const handleReset = () => {
    setState(DEFAULT_APP_STATE);
    setResetSignal((n) => n + 1);
  };
  // App theme and cube-viz theme are independent: the header toggle changes
  // only the app chrome, the cube toolbar's own toggle changes only the cube.
  // Neither cascades into the other, so a deliberate cube-theme choice is
  // never silently overwritten.
  const toggleAppTheme = () => {
    const next: Theme = appTheme === "light" ? "dark" : "light";
    setAppThemeState(next);
    writeStoredTheme(APP_THEME_KEY, next);
    announce(next === "dark" ? "Dark theme" : "Light theme");
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
            previewMode={previewMode}
          />
          <PreviewControl value={previewMode} onChange={setPreviewMode} />
          <GradientStrip params={params} previewMode={previewMode} />
          <GammaBar params={params} />
          <SwatchRow params={params} count={swatchCount} previewMode={previewMode} />
        </section>
        <div className="layout-controls">
          <PresetGallery
            params={params}
            onSelect={(nextParams) => {
              setParams(nextParams);
              // Presets ship start/rotations directly; drop any waypoint state
              // so the loaded preset isn't immediately re-solved away.
              if (hueAuthoring.mode !== "freeform") {
                setHueAuthoring({ mode: "freeform" });
              }
              // Remount ParamControls so its Tier 3 state (saturation
              // link state, remembered curves) re-seeds from the preset.
              setPresetEpoch((n) => n + 1);
            }}
          />
          <ParamControls
            key={`${resetSignal}-${presetEpoch}`}
            params={params}
            onChange={setParams}
            swatchCount={swatchCount}
            onSwatchCountChange={setSwatchCount}
            hueAuthoring={hueAuthoring}
            onHueAuthoringChange={setHueAuthoring}
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
