import { useMemo, useRef, type ComponentRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CubehelixParams, PreviewMode } from "@cubehelix-studio/core";
import { effectiveSampleCount } from "../lib/sample-count";
import { CameraRig } from "./cube/CameraRig";
import { CornerMarkers, CubeWireframe } from "./cube/CubeScaffold";
import { CubeToolbar, SettingsPanel, SnapPanel } from "./cube/CubeToolbar";
import { Helix } from "./cube/Helix";
import { LightnessAxis } from "./cube/LightnessAxis";
import { useCubeView } from "./cube/useCubeView";

interface CubeVisualizationProps {
  params: CubehelixParams;
  samples?: number;
  resetSignal?: number;
  cubeTheme: "light" | "dark";
  onCubeThemeChange: (next: "light" | "dark") => void;
  previewMode?: PreviewMode;
}

const CUBE_BG_DARK = "#1a1a1a";
const CUBE_BG_LIGHT = "#f5f5f5";
const GHOST_COLOR_DARK = 0xffffff;
const GHOST_COLOR_LIGHT = 0x222222;

/** Orchestrates the 3D cube view: the toolbar, the R3F canvas and its scene
 *  pieces, and the snap / settings panels. View state lives in useCubeView. */
export function CubeVisualization({
  params,
  samples,
  resetSignal,
  cubeTheme,
  onCubeThemeChange,
  previewMode = "normal",
}: CubeVisualizationProps) {
  const effectiveSamples = useMemo(
    () => effectiveSampleCount(params.rotations, samples),
    [samples, params.rotations],
  );
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const {
    view,
    setView,
    snap,
    activePanel,
    handleReset,
    handleSnap,
    togglePanel,
    toggleAutoRotate,
    toggleCanvas,
  } = useCubeView(controlsRef, resetSignal);

  const toggleCubeTheme = () => {
    onCubeThemeChange(cubeTheme === "light" ? "dark" : "light");
  };
  const cubeBg = cubeTheme === "dark" ? CUBE_BG_DARK : CUBE_BG_LIGHT;
  const ghostColor = cubeTheme === "dark" ? GHOST_COLOR_DARK : GHOST_COLOR_LIGHT;

  return (
    <div className="cube-area">
      <CubeToolbar
        view={view}
        cubeTheme={cubeTheme}
        onAutoRotateToggle={toggleAutoRotate}
        onCanvasToggle={toggleCanvas}
        onCubeThemeToggle={toggleCubeTheme}
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        onReset={handleReset}
      />
      {view.showCanvas && (
        <div className="cube-visualization" style={{ background: cubeBg }}>
          <Canvas gl={{ toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}>
            <color attach="background" args={[cubeBg]} />
            <CameraRig projection={view.projection} controlsRef={controlsRef} snap={snap} />
            <group position={[-0.5, -0.5, -0.5]}>
              {view.showWireframe && <CubeWireframe />}
              <LightnessAxis
                lightnessAxisMin={params.lightnessAxisMin}
                lightnessAxisMax={params.lightnessAxisMax}
                showAxis={view.showAxis}
                showGhost={view.showGhostAxis}
                showHandles={view.showAxisHandles}
              />
              {view.showVertices && <CornerMarkers />}
              <Helix
                params={params}
                samples={effectiveSamples}
                showGhost={view.showGhostHelix}
                ghostColor={ghostColor}
                previewMode={previewMode}
              />
            </group>
            <OrbitControls
              ref={controlsRef}
              makeDefault
              enableDamping
              autoRotate={view.autoRotate}
            />
          </Canvas>
        </div>
      )}
      {activePanel === "snaps" && <SnapPanel onSnap={handleSnap} />}
      {activePanel === "settings" && <SettingsPanel view={view} onChange={setView} />}
    </div>
  );
}
