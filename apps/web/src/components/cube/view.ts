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

/**
 * A camera snap target: a cube corner or face, with its viewing direction.
 *
 * Corners are identified by their single color (Black, Red, …, White) and
 * carry a `swatch`. Faces are identified by their four corner colors and
 * carry a four-letter `label` whose letters line up with the `corners`
 * dot-glyph positions in row-major order (top-left, top-right, bottom-left,
 * bottom-right). The `description` is the screen-reader-friendly form used
 * for aria-labels.
 */
export interface Snap {
  id: SnapId;
  label: string;
  description: string;
  group: "corner" | "face";
  dir: [number, number, number];
  up: [number, number, number];
  swatch?: string;
  corners?: [string, string, string, string];
}

const K = "#000000";
const R = "#ff0000";
const G = "#00ff00";
const B = "#0000ff";
const C = "#00ffff";
const M = "#ff00ff";
const Y = "#ffff00";
const W = "#ffffff";

export const SNAPS: Snap[] = [
  // Corners.
  {
    id: "k",
    label: "Black",
    description: "Black",
    group: "corner",
    dir: [-1, -1, -1],
    up: [0, 1, 0],
    swatch: K,
  },
  {
    id: "r",
    label: "Red",
    description: "Red",
    group: "corner",
    dir: [1, -1, -1],
    up: [0, 1, 0],
    swatch: R,
  },
  {
    id: "g",
    label: "Green",
    description: "Green",
    group: "corner",
    dir: [-1, 1, -1],
    up: [0, 1, 0],
    swatch: G,
  },
  {
    id: "b",
    label: "Blue",
    description: "Blue",
    group: "corner",
    dir: [-1, -1, 1],
    up: [0, 1, 0],
    swatch: B,
  },
  {
    id: "c",
    label: "Cyan",
    description: "Cyan",
    group: "corner",
    dir: [-1, 1, 1],
    up: [0, 1, 0],
    swatch: C,
  },
  {
    id: "m",
    label: "Magenta",
    description: "Magenta",
    group: "corner",
    dir: [1, -1, 1],
    up: [0, 1, 0],
    swatch: M,
  },
  {
    id: "y",
    label: "Yellow",
    description: "Yellow",
    group: "corner",
    dir: [1, 1, -1],
    up: [0, 1, 0],
    swatch: Y,
  },
  {
    id: "w",
    label: "White",
    description: "White",
    group: "corner",
    dir: [1, 1, 1],
    up: [0, 1, 0],
    swatch: W,
  },
  // Faces, labeled by their four corner letters in row-major order.
  {
    id: "+r",
    label: "RYWM",
    description: "Red, Yellow, White, Magenta",
    group: "face",
    dir: [1, 0, 0],
    up: [0, 1, 0],
    corners: [R, Y, W, M],
  },
  {
    id: "-r",
    label: "KGCB",
    description: "Black, Green, Cyan, Blue",
    group: "face",
    dir: [-1, 0, 0],
    up: [0, 1, 0],
    corners: [K, G, C, B],
  },
  {
    id: "+g",
    label: "GYWC",
    description: "Green, Yellow, White, Cyan",
    group: "face",
    dir: [0, 1, 0],
    up: [0, 0, 1],
    corners: [G, Y, W, C],
  },
  {
    id: "-g",
    label: "KRMB",
    description: "Black, Red, Magenta, Blue",
    group: "face",
    dir: [0, -1, 0],
    up: [0, 0, 1],
    corners: [K, R, M, B],
  },
  {
    id: "+b",
    label: "BMWC",
    description: "Blue, Magenta, White, Cyan",
    group: "face",
    dir: [0, 0, 1],
    up: [0, 1, 0],
    corners: [B, M, W, C],
  },
  {
    id: "-b",
    label: "KRYG",
    description: "Black, Red, Yellow, Green",
    group: "face",
    dir: [0, 0, -1],
    up: [0, 1, 0],
    corners: [K, R, Y, G],
  },
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
