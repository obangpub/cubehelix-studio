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
 * bottom-right) as the face appears once the camera has snapped to it —
 * i.e. as projected onto the screen from `dir` with `up` as the camera's up
 * vector. The `description` is the screen-reader-friendly form used for
 * aria-labels.
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
  // Faces, labeled by their four corner letters in row-major order as the
  // face appears once the camera has snapped to it.
  {
    id: "+r",
    label: "WYMR",
    description: "White, Yellow, Magenta, Red",
    group: "face",
    dir: [1, 0, 0],
    up: [0, 1, 0],
    corners: [W, Y, M, R],
  },
  {
    id: "-r",
    label: "GCKB",
    description: "Green, Cyan, Black, Blue",
    group: "face",
    dir: [-1, 0, 0],
    up: [0, 1, 0],
    corners: [G, C, K, B],
  },
  {
    id: "+g",
    label: "WCYG",
    description: "White, Cyan, Yellow, Green",
    group: "face",
    dir: [0, 1, 0],
    up: [0, 0, 1],
    corners: [W, C, Y, G],
  },
  {
    id: "-g",
    label: "BMKR",
    description: "Blue, Magenta, Black, Red",
    group: "face",
    dir: [0, -1, 0],
    up: [0, 0, 1],
    corners: [B, M, K, R],
  },
  {
    id: "+b",
    label: "CWBM",
    description: "Cyan, White, Blue, Magenta",
    group: "face",
    dir: [0, 0, 1],
    up: [0, 1, 0],
    corners: [C, W, B, M],
  },
  {
    id: "-b",
    label: "YGRK",
    description: "Yellow, Green, Red, Black",
    group: "face",
    dir: [0, 0, -1],
    up: [0, 1, 0],
    corners: [Y, G, R, K],
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
