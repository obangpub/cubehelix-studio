import {
  AutoRotateIcon,
  CogIcon,
  CubeIcon,
  MoonIcon,
  PowerIcon,
  ResetIcon,
  SunIcon,
} from "../icons";
import {
  SNAPS,
  allVisible,
  setAllVisibility,
  type PanelId,
  type SnapId,
  type ViewSettings,
} from "./view";

interface SnapPanelProps {
  onSnap: (id: SnapId) => void;
}

/** Grid of buttons that snap the camera to a cube corner or face. */
export function SnapPanel({ onSnap }: SnapPanelProps) {
  const corners = SNAPS.filter((s) => s.group === "corner");
  const faces = SNAPS.filter((s) => s.group === "face");
  return (
    <div className="cube-panel" role="group" aria-label="Snap camera to view">
      <div className="cube-panel-row">
        <span className="cube-panel-label">Corners</span>
        <div className="cube-snap-grid">
          {corners.map((s) => (
            <button
              key={s.id}
              type="button"
              className="cube-snap-button"
              onClick={() => onSnap(s.id)}
              aria-label={`Snap to ${s.label} corner`}
            >
              <span className="cube-snap-swatch" style={{ background: s.swatch }} aria-hidden />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="cube-panel-row">
        <span className="cube-panel-label">Faces</span>
        <div className="cube-snap-grid">
          {faces.map((s) => (
            <button
              key={s.id}
              type="button"
              className="cube-snap-button"
              onClick={() => onSnap(s.id)}
              aria-label={`Snap to ${s.label} face`}
            >
              <span className="cube-snap-swatch" style={{ background: s.swatch }} aria-hidden />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SettingsPanelProps {
  view: ViewSettings;
  onChange: (next: ViewSettings) => void;
}

/** Projection selector and the per-element visibility toggles. */
export function SettingsPanel({ view, onChange }: SettingsPanelProps) {
  const allOn = allVisible(view);
  return (
    <div className="cube-panel" role="group" aria-label="Cube view settings">
      <div className="cube-panel-row">
        <span className="cube-panel-label">Projection</span>
        <div className="segmented" role="radiogroup" aria-label="Projection">
          {(["perspective", "orthographic"] as const).map((p) => (
            <label
              key={p}
              className={`segmented-option ${view.projection === p ? "is-active" : ""}`}
            >
              <input
                type="radio"
                name="cube-projection"
                value={p}
                checked={view.projection === p}
                onChange={() => onChange({ ...view, projection: p })}
              />
              <span>{p === "perspective" ? "Perspective" : "Orthographic"}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="cube-panel-row">
        <div className="cube-panel-label-row">
          <span className="cube-panel-label">Visibility</span>
          <button
            type="button"
            className="cube-panel-button"
            onClick={() => onChange(setAllVisibility(view, !allOn))}
          >
            {allOn ? "Hide all" : "Show all"}
          </button>
        </div>
        <div className="cube-visibility-grid">
          <label className="toggle">
            <input
              type="checkbox"
              checked={view.showWireframe}
              onChange={(e) => onChange({ ...view, showWireframe: e.currentTarget.checked })}
            />
            <span>Cube wireframe</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={view.showVertices}
              onChange={(e) => onChange({ ...view, showVertices: e.currentTarget.checked })}
            />
            <span>Cube vertices</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={view.showAxis}
              onChange={(e) => onChange({ ...view, showAxis: e.currentTarget.checked })}
            />
            <span>Lightness axis</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={view.showAxisHandles}
              onChange={(e) => onChange({ ...view, showAxisHandles: e.currentTarget.checked })}
            />
            <span>Lightness axis handles</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={view.showGhostAxis}
              onChange={(e) => onChange({ ...view, showGhostAxis: e.currentTarget.checked })}
            />
            <span>Ghost lightness axis</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={view.showGhostHelix}
              onChange={(e) => onChange({ ...view, showGhostHelix: e.currentTarget.checked })}
            />
            <span>Ghost helix</span>
          </label>
        </div>
      </div>
    </div>
  );
}

interface ToolbarProps {
  view: ViewSettings;
  cubeTheme: "light" | "dark";
  onAutoRotateToggle: () => void;
  onCanvasToggle: () => void;
  onCubeThemeToggle: () => void;
  activePanel: PanelId | null;
  onTogglePanel: (panel: PanelId) => void;
  onReset: () => void;
}

/** The row of icon buttons above the cube canvas. */
export function CubeToolbar({
  view,
  cubeTheme,
  onAutoRotateToggle,
  onCanvasToggle,
  onCubeThemeToggle,
  activePanel,
  onTogglePanel,
  onReset,
}: ToolbarProps) {
  return (
    <div className="cube-toolbar">
      <div className="cube-toolbar-group">
        <button
          type="button"
          className={`cube-icon-button cube-toggle-button ${view.showCanvas ? "is-active" : ""}`}
          onClick={onCanvasToggle}
          aria-pressed={view.showCanvas}
        >
          <PowerIcon />
          <span>3D cube</span>
        </button>
      </div>
      <div className="cube-toolbar-group">
        <button
          type="button"
          className={`cube-icon-button ${view.autoRotate ? "is-active" : ""}`}
          onClick={onAutoRotateToggle}
          aria-pressed={view.autoRotate}
          aria-label="Auto-rotate"
          title={view.autoRotate ? "Stop auto-rotate" : "Auto-rotate"}
        >
          <AutoRotateIcon />
        </button>
        <button
          type="button"
          className={`cube-icon-button ${activePanel === "snaps" ? "is-active" : ""}`}
          onClick={() => onTogglePanel("snaps")}
          aria-pressed={activePanel === "snaps"}
          aria-expanded={activePanel === "snaps"}
          aria-label="Snap to view"
          title="Snap to view"
        >
          <CubeIcon />
        </button>
        <button
          type="button"
          className={`cube-icon-button ${activePanel === "settings" ? "is-active" : ""}`}
          onClick={() => onTogglePanel("settings")}
          aria-pressed={activePanel === "settings"}
          aria-expanded={activePanel === "settings"}
          aria-label="View settings"
          title="View settings"
        >
          <CogIcon />
        </button>
        <button
          type="button"
          className="cube-icon-button"
          onClick={onCubeThemeToggle}
          aria-label={
            cubeTheme === "dark" ? "Use light cube background" : "Use dark cube background"
          }
          title={cubeTheme === "dark" ? "Use light cube background" : "Use dark cube background"}
        >
          {cubeTheme === "dark" ? <SunIcon size={14} /> : <MoonIcon size={14} />}
        </button>
        <button
          type="button"
          className="cube-icon-button"
          onClick={onReset}
          title="Reset view"
          aria-label="Reset view"
        >
          <ResetIcon />
        </button>
      </div>
    </div>
  );
}
