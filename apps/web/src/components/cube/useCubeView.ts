import { useCallback, useEffect, useState, type ComponentRef, type RefObject } from "react";
import type { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_VIEW,
  ORTHO_ZOOM,
  type PanelId,
  type SnapId,
  type ViewSettings,
} from "./view";

type ControlsRef = RefObject<ComponentRef<typeof OrbitControls> | null>;

// Start with the 3D cube hidden on phone-width viewports — it is the heaviest
// part of the page, and the labeled "3D cube" toggle lets a mobile user opt in.
// Desktop keeps it on. Re-evaluated on Reset so the choice stays consistent.
function initialView(): ViewSettings {
  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  return narrow ? { ...DEFAULT_VIEW, showCanvas: false } : DEFAULT_VIEW;
}

/**
 * Owns the cube's Tier 3 / ephemeral view state — toggle settings, the active
 * snap, the open panel — and the camera-reset logic. The header Reset pulse
 * (`resetSignal`) returns the whole visualization to defaults.
 */
export function useCubeView(controlsRef: ControlsRef, resetSignal: number | undefined) {
  const [view, setView] = useState<ViewSettings>(initialView);
  const [snap, setSnap] = useState<{ id: SnapId; signal: number } | null>(null);
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);

  // Set the view back to the original default explicitly rather than via
  // controls.reset(). drei re-binds OrbitControls to a new camera instance on
  // each projection swap, which re-captures the saved-state pose at swap time
  // — so reset() would restore whatever the camera happened to be at then,
  // not the original default. Setting the state by hand makes reset
  // deterministic across projection switches.
  const resetView = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object;
    cam.position.set(...DEFAULT_CAMERA_POSITION);
    cam.up.set(0, 1, 0);
    controls.target.set(0, 0, 0);
    if (cam instanceof THREE.OrthographicCamera) {
      cam.zoom = ORTHO_ZOOM;
      cam.updateProjectionMatrix();
    } else if (cam instanceof THREE.PerspectiveCamera) {
      cam.zoom = 1;
      cam.updateProjectionMatrix();
    }
    cam.lookAt(0, 0, 0);
    controls.update();
  }, [controlsRef]);

  // Header Reset pulses resetSignal; the cube returns its camera, view toggles,
  // snap, and open panel to defaults. `showCanvas` is the exception — whether
  // the 3D view is shown is the user's workspace choice, not part of the
  // palette, so Reset leaves it wherever the user set it.
  useEffect(() => {
    if (resetSignal === undefined) return;
    resetView();
    setView((prev) => ({ ...DEFAULT_VIEW, showCanvas: prev.showCanvas }));
    setSnap(null);
    setActivePanel(null);
  }, [resetSignal, resetView]);

  const handleSnap = useCallback((id: SnapId) => {
    setSnap((prev) => ({ id, signal: (prev?.signal ?? 0) + 1 }));
  }, []);
  const togglePanel = useCallback((panel: PanelId) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);
  const toggleAutoRotate = useCallback(() => {
    setView((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
  }, []);
  const toggleCanvas = useCallback(() => {
    setView((prev) => ({ ...prev, showCanvas: !prev.showCanvas }));
  }, []);

  return {
    view,
    setView,
    snap,
    activePanel,
    handleReset: resetView,
    handleSnap,
    togglePanel,
    toggleAutoRotate,
    toggleCanvas,
  };
}
