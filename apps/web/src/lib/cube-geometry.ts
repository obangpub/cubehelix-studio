import * as THREE from "three";
import { applyPreview, type PreviewMode, type RGB } from "@cubehelix-studio/core";
import type { Sample } from "./helix-samples";

const TUBE_RADIUS = 0.01;
const COLOR_RADIAL_SEGMENTS = 8;
const GHOST_DASH_SIZE = 0.025;
const GHOST_GAP_SIZE = 0.02;
const GHOST_OPACITY = 0.55;
/** How far a ghost run extends past its endpoints so it emerges smoothly. */
const GHOST_EMERGE_SAMPLES = 4;

/** Geometry for the in-gamut tube plus the out-of-gamut ghost lines. */
export interface ScenePieces {
  colored: THREE.BufferGeometry[];
  ghosts: THREE.Line[];
}

/** A three.js curve that interpolates a polyline by parameter, not arc length. */
export class PolylineCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private points: THREE.Vector3[]) {
    super();
  }
  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const n = this.points.length - 1;
    if (n <= 0) return target.copy(this.points[0]!);
    const seg = t * n;
    const i = Math.min(Math.floor(seg), n - 1);
    const f = seg - i;
    return target.lerpVectors(this.points[i]!, this.points[i + 1]!, f);
  }
  // TubeGeometry calls getPointAt(u) internally and the base class re-samples
  // by arc length. With a non-uniformly-spaced polyline (e.g. high-rotation
  // cubehelix where chroma rotation dominates near peak amp but lightness
  // dominates near the endpoints), arc-length sampling places cross-sections
  // at different parameter positions than our sample indices, breaking the
  // mapping between vertex index and sample color. Treat u as t directly.
  override getPointAt(u: number, optionalTarget?: THREE.Vector3): THREE.Vector3 {
    return this.getPoint(u, optionalTarget);
  }
}

function srgbToLinear(c: number): number {
  if (c <= 0.04045) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

function sampleToVec(c: RGB): THREE.Vector3 {
  return new THREE.Vector3(c.r, c.g, c.b);
}

function buildColoredTube(
  positions: THREE.Vector3[],
  colors: RGB[],
  radius: number,
  radialSegments: number,
  clampToCube = false,
): THREE.BufferGeometry {
  const tubularSegments = positions.length - 1;
  const curve = new PolylineCurve(positions);
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  if (clampToCube) {
    const pos = geometry.attributes.position!.array as Float32Array;
    for (let i = 0; i < pos.length; i++) {
      const v = pos[i]!;
      if (v < 0) pos[i] = 0;
      else if (v > 1) pos[i] = 1;
    }
    geometry.attributes.position!.needsUpdate = true;
  }
  const colorArray = new Float32Array((tubularSegments + 1) * (radialSegments + 1) * 3);
  for (let i = 0; i <= tubularSegments; i++) {
    const c = colors[i]!;
    const lr = srgbToLinear(c.r);
    const lg = srgbToLinear(c.g);
    const lb = srgbToLinear(c.b);
    for (let j = 0; j <= radialSegments; j++) {
      const idx = (i * (radialSegments + 1) + j) * 3;
      colorArray[idx] = lr;
      colorArray[idx + 1] = lg;
      colorArray[idx + 2] = lb;
    }
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
  return geometry;
}

function buildGhostLine(positions: THREE.Vector3[], color: number): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(positions);
  const material = new THREE.LineDashedMaterial({
    color,
    dashSize: GHOST_DASH_SIZE,
    gapSize: GHOST_GAP_SIZE,
    transparent: true,
    opacity: GHOST_OPACITY,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
}

/** Invoke `onRun` for each maximal run of samples matching `predicate`, with
 *  `extend` samples of context added on each side. */
export function forEachRun(
  samples: Sample[],
  predicate: (s: Sample) => boolean,
  extend: number,
  onRun: (run: Sample[]) => void,
): void {
  let runStart = -1;
  for (let i = 0; i <= samples.length; i++) {
    const inRun = i < samples.length && predicate(samples[i]!);
    if (inRun && runStart === -1) runStart = i;
    if ((!inRun || i === samples.length) && runStart !== -1) {
      const start = Math.max(0, runStart - extend);
      const end = Math.min(samples.length, i + extend);
      onRun(samples.slice(start, end));
      runStart = -1;
    }
  }
}

/** Build the colored-tube and ghost-line geometry for a set of samples. */
export function buildScene(
  samples: Sample[],
  ghostColor: number,
  previewMode: PreviewMode,
): ScenePieces {
  const colored: THREE.BufferGeometry[] = [];
  const ghosts: THREE.Line[] = [];
  if (samples.length < 2) return { colored, ghosts };

  // Helix position stays at the true RGB-cube coordinates so the path through
  // the cube remains the data-truth visualization. Only the rendered color
  // goes through the preview transform — the user reads "this is where the
  // helix lives" alongside "this is what each point looks like to the
  // simulated viewer."
  forEachRun(
    samples,
    (s) => s.inRange,
    0,
    (run) => {
      if (run.length < 2) return;
      const positions = run.map((s) => sampleToVec(s.clamped));
      const cols = run.map((s) => applyPreview(s.clamped, previewMode));
      colored.push(buildColoredTube(positions, cols, TUBE_RADIUS, COLOR_RADIAL_SEGMENTS, true));
    },
  );

  forEachRun(
    samples,
    (s) => !s.inGamut || !s.inRange,
    GHOST_EMERGE_SAMPLES,
    (run) => {
      if (run.length < 2) return;
      const positions = run.map((s) => sampleToVec(s.raw));
      ghosts.push(buildGhostLine(positions, ghostColor));
    },
  );

  return { colored, ghosts };
}
