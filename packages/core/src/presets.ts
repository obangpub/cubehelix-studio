import { DEFAULT_CUBEHELIX_PARAMS } from "./cubehelix";
import type { CubehelixParams } from "./types";

export type PaletteMode = "sequential" | "diverging";

export interface Preset {
  id: string;
  name: string;
  description: string;
  mode: PaletteMode;
  params: CubehelixParams;
}

export const PRESETS: readonly Preset[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Green's 2011 defaults; the canonical cubehelix ramp.",
    mode: "sequential",
    params: { ...DEFAULT_CUBEHELIX_PARAMS },
  },
  {
    id: "embers",
    name: "Embers",
    description: "Near-black through deep red into orange and yellow.",
    mode: "sequential",
    params: {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 1.0,
      rotations: 0.4,
      saturationMin: 1.4,
      saturationMax: 1.4,
    },
  },
  {
    id: "tidewater",
    name: "Tidewater",
    description: "Navy through teal to pale cyan; cool sequential.",
    mode: "sequential",
    params: {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 2.6,
      rotations: 0.5,
      saturationMin: 1.25,
      saturationMax: 1.25,
    },
  },
  {
    id: "foxglove",
    name: "Foxglove",
    description: "Forest green through dusty rose to soft pink.",
    mode: "sequential",
    params: {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 2.0,
      rotations: 1.2,
      saturationMin: 1.15,
      saturationMax: 1.15,
    },
  },
  {
    id: "lichen",
    name: "Lichen",
    description: "Charcoal through olive to pale chartreuse; earthy and muted.",
    mode: "sequential",
    params: {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 1.7,
      rotations: 0.3,
      saturationMin: 0.7,
      saturationMax: 0.7,
    },
  },
  {
    id: "iris",
    name: "Iris",
    description: "Deep indigo through violet to pale lavender.",
    mode: "sequential",
    params: {
      ...DEFAULT_CUBEHELIX_PARAMS,
      start: 0.4,
      rotations: 0.4,
      saturationMin: 1.1,
      saturationMax: 1.1,
    },
  },
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
