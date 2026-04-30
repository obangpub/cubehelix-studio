export type LightnessCurve =
  | { kind: "power"; gamma: number }
  | { kind: "sigmoid"; steepness: number; midpoint: number }
  | { kind: "bezier"; p1: [number, number]; p2: [number, number] };

export interface CubehelixParams {
  start: number;
  rotations: number;
  saturation: number;
  lightnessCurve: LightnessCurve;
  lightnessMin: number;
  lightnessMax: number;
  reverse: boolean;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}
