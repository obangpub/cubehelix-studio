/**
 * View-model types and constants shared across the cube visualization
 * modules: camera placement, the snap targets, and the toggleable view
 * settings.
 */

export const DEFAULT_CAMERA_POSITION: [number, number, number] = [1.3, 0.9, 1.7];
export const ORTHO_ZOOM = 280;
export const SNAP_DISTANCE = 2.5;

export type SnapId =
  | "k"
  | "r"
  | "g"
  | "b"
  | "c"
  | "m"
  | "y"
  | "w"
  | "+r"
  | "-r"
  | "+g"
  | "-g"
  | "+b"
  | "-b";

/** A camera snap target: a cube corner or face, with its viewing direction. */
export interface Snap {
  id: SnapId;
  label: string;
  group: "corner" | "face";
  dir: [number, number, number];
  up: [number, number, number];
  swatch: string;
}

export const SNAPS: Snap[] = [
  { id: "k", label: "Black", group: "corner", dir: [-1, -1, -1], up: [0, 1, 0], swatch: "#000000" },
  { id: "r", label: "Red", group: "corner", dir: [1, -1, -1], up: [0, 1, 0], swatch: "#ff0000" },
  { id: "g", label: "Green", group: "corner", dir: [-1, 1, -1], up: [0, 1, 0], swatch: "#00ff00" },
  { id: "b", label: "Blue", group: "corner", dir: [-1, -1, 1], up: [0, 1, 0], swatch: "#0000ff" },
  { id: "c", label: "Cyan", group: "corner", dir: [-1, 1, 1], up: [0, 1, 0], swatch: "#00ffff" },
  { id: "m", label: "Magenta", group: "corner", dir: [1, -1, 1], up: [0, 1, 0], swatch: "#ff00ff" },
  { id: "y", label: "Yellow", group: "corner", dir: [1, 1, -1], up: [0, 1, 0], swatch: "#ffff00" },
  { id: "w", label: "White", group: "corner", dir: [1, 1, 1], up: [0, 1, 0], swatch: "#ffffff" },
  { id: "+r", label: "Red", group: "face", dir: [1, 0, 0], up: [0, 1, 0], swatch: "#ff0000" },
  { id: "-r", label: "Cyan", group: "face", dir: [-1, 0, 0], up: [0, 1, 0], swatch: "#00ffff" },
  { id: "+g", label: "Green", group: "face", dir: [0, 1, 0], up: [0, 0, 1], swatch: "#00ff00" },
  { id: "-g", label: "Magenta", group: "face", dir: [0, -1, 0], up: [0, 0, 1], swatch: "#ff00ff" },
  { id: "+b", label: "Blue", group: "face", dir: [0, 0, 1], up: [0, 1, 0], swatch: "#0000ff" },
  { id: "-b", label: "Yellow", group: "face", dir: [0, 0, -1], up: [0, 1, 0], swatch: "#ffff00" },
];

export type PanelId = "snaps" | "settings";

/** Toggleable cube-view settings, controlled from the toolbar and panels. */
export interface ViewSettings {
  projection: "perspective" | "orthographic";
  autoRotate: boolean;
  showCanvas: boolean;
  showWireframe: boolean;
  showVertices: boolean;
  showAxis: boolean;
  showAxisHandles: boolean;
  showGhostAxis: boolean;
  showGhostHelix: boolean;
}

export const DEFAULT_VIEW: ViewSettings = {
  projection: "perspective",
  autoRotate: false,
  showCanvas: true,
  showWireframe: true,
  showVertices: true,
  showAxis: true,
  showAxisHandles: true,
  showGhostAxis: true,
  showGhostHelix: true,
};

/** The settings toggled together by the panel's "Show all" / "Hide all". */
const VISIBILITY_KEYS = [
  "showCanvas",
  "showWireframe",
  "showVertices",
  "showAxis",
  "showAxisHandles",
  "showGhostAxis",
  "showGhostHelix",
] as const satisfies readonly (keyof ViewSettings)[];

export function allVisible(view: ViewSettings): boolean {
  return VISIBILITY_KEYS.every((k) => view[k]);
}

export function setAllVisibility(view: ViewSettings, value: boolean): ViewSettings {
  const next = { ...view };
  for (const k of VISIBILITY_KEYS) next[k] = value;
  return next;
}
