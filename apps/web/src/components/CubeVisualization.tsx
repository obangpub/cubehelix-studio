import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  cubehelixRaw,
  evaluateLightnessCurve,
  type CubehelixParams,
  type LightnessCurve,
  type RGB,
} from "@cubehelix-studio/core";

interface CubeVisualizationProps {
  params: CubehelixParams;
  samples?: number;
  resetSignal?: number;
}

interface Sample {
  u: number;
  raw: RGB;
  clamped: RGB;
  inGamut: boolean;
  inRange: boolean;
}

const TUBE_RADIUS = 0.01;
const COLOR_RADIAL_SEGMENTS = 8;
const GHOST_DASH_SIZE = 0.025;
const GHOST_GAP_SIZE = 0.02;
const GHOST_OPACITY = 0.55;
const GHOST_EMERGE_SAMPLES = 4;
const BISECT_ITER = 6;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function isInGamut(c: RGB): boolean {
  return c.r >= 0 && c.r <= 1 && c.g >= 0 && c.g <= 1 && c.b >= 0 && c.b <= 1;
}

function bisectCrossing(uLo: number, uHi: number, inLo: boolean, params: CubehelixParams): number {
  let lo = uLo;
  let hi = uHi;
  for (let i = 0; i < BISECT_ITER; i++) {
    const mid = (lo + hi) / 2;
    const inMid = isInGamut(cubehelixRaw(mid, params));
    if (inMid === inLo) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

function findCurveCrossing(curve: LightnessCurve, target: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const v = evaluateLightnessCurve(curve, mid);
    if (v < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function buildSamples(params: CubehelixParams, n: number): Sample[] {
  // Cube viz renders the full underlying helix (parameterized over u in [0,1]
  // of the canonical cubehelix curve, where u is tEff with lightness-range
  // and reverse stripped), then marks which segments fall in the user's
  // visible window. Stripping lightness-range AND reverse is required, since
  // both are user-visible-window concerns rather than curve-shape concerns.
  // Keeping reverse here would double-reverse and paint mismatched hues
  // against the swatches.
  const fullHelixParams: CubehelixParams = {
    ...params,
    lightnessMin: 0,
    lightnessMax: 1,
    reverse: false,
  };
  const { lightnessCurve, lightnessMin, lightnessMax } = params;

  const makeAt = (u: number): Sample => {
    const raw = cubehelixRaw(u, fullHelixParams);
    const clamped = { r: clamp01(raw.r), g: clamp01(raw.g), b: clamp01(raw.b) };
    const lightness = evaluateLightnessCurve(lightnessCurve, u);
    return {
      u,
      raw,
      clamped,
      inGamut: isInGamut(raw),
      inRange: lightness >= lightnessMin && lightness <= lightnessMax,
    };
  };

  const base: Sample[] = [];
  for (let i = 0; i <= n; i++) {
    base.push(makeAt(i / n));
  }

  const breakpoints: number[] = [];
  if (lightnessMin > 0) breakpoints.push(findCurveCrossing(lightnessCurve, lightnessMin));
  if (lightnessMax < 1) breakpoints.push(findCurveCrossing(lightnessCurve, lightnessMax));
  for (const u of breakpoints) {
    if (u <= 0 || u >= 1) continue;
    const idx = base.findIndex((s) => s.u >= u);
    if (idx === -1) base.push(makeAt(u));
    else if (base[idx]!.u !== u) base.splice(idx, 0, makeAt(u));
  }

  const out: Sample[] = [base[0]!];
  for (let i = 0; i < base.length - 1; i++) {
    const a = base[i]!;
    const b = base[i + 1]!;
    if (a.inGamut !== b.inGamut) {
      const uCross = bisectCrossing(a.u, b.u, a.inGamut, fullHelixParams);
      out.push(makeAt(uCross));
    } else {
      // Both endpoints share the same gamut state. Probe the midpoint to
      // catch sub-sample excursions (helix dips out and back within one
      // sample interval at high saturation + extreme gamma).
      const mid = makeAt((a.u + b.u) / 2);
      if (mid.inGamut !== a.inGamut) {
        const uEnter = bisectCrossing(a.u, mid.u, a.inGamut, fullHelixParams);
        const uExit = bisectCrossing(mid.u, b.u, mid.inGamut, fullHelixParams);
        out.push(makeAt(uEnter));
        out.push(mid);
        out.push(makeAt(uExit));
      }
    }
    out.push(b);
  }
  return out;
}

class PolylineCurve extends THREE.Curve<THREE.Vector3> {
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

function srgbToLinear(c: number): number {
  if (c <= 0.04045) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

function sampleToVec(c: RGB): THREE.Vector3 {
  return new THREE.Vector3(c.r, c.g, c.b);
}

interface ScenePieces {
  colored: THREE.BufferGeometry[];
  ghosts: THREE.Line[];
}

function forEachRun(
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

function buildGhostLine(positions: THREE.Vector3[]): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(positions);
  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: GHOST_DASH_SIZE,
    gapSize: GHOST_GAP_SIZE,
    transparent: true,
    opacity: GHOST_OPACITY,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
}

function buildScene(samples: Sample[]): ScenePieces {
  const colored: THREE.BufferGeometry[] = [];
  const ghosts: THREE.Line[] = [];
  if (samples.length < 2) return { colored, ghosts };

  forEachRun(
    samples,
    (s) => s.inRange,
    0,
    (run) => {
      if (run.length < 2) return;
      const positions = run.map((s) => sampleToVec(s.clamped));
      const cols = run.map((s) => s.clamped);
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
      ghosts.push(buildGhostLine(positions));
    },
  );

  return { colored, ghosts };
}

const CORNERS: { pos: [number, number, number]; color: string }[] = [
  { pos: [0, 0, 0], color: "#000000" },
  { pos: [1, 0, 0], color: "#ff0000" },
  { pos: [0, 1, 0], color: "#00ff00" },
  { pos: [0, 0, 1], color: "#0000ff" },
  { pos: [1, 1, 0], color: "#ffff00" },
  { pos: [1, 0, 1], color: "#ff00ff" },
  { pos: [0, 1, 1], color: "#00ffff" },
  { pos: [1, 1, 1], color: "#ffffff" },
];

function CubeWireframe() {
  const edges = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const e = new THREE.EdgesGeometry(box);
    box.dispose();
    return e;
  }, []);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <lineSegments geometry={edges} position={[0.5, 0.5, 0.5]}>
      <lineBasicMaterial color="#888888" />
    </lineSegments>
  );
}

function GrayDiagonal() {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <line>
      <primitive attach="geometry" object={geom} />
      <lineDashedMaterial color="#666666" dashSize={0.05} gapSize={0.03} />
    </line>
  );
}

function CornerMarkers() {
  return (
    <>
      {CORNERS.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color={c.color} />
        </mesh>
      ))}
    </>
  );
}

interface HelixProps {
  params: CubehelixParams;
  samples: number;
}

function Helix({ params, samples }: HelixProps) {
  const { colored, ghosts } = useMemo(() => {
    const s = buildSamples(params, samples);
    return buildScene(s);
  }, [params, samples]);

  useEffect(() => {
    return () => {
      for (const g of colored) g.dispose();
      for (const line of ghosts) {
        line.geometry.dispose();
        const material = line.material;
        if (Array.isArray(material)) {
          for (const m of material) m.dispose();
        } else {
          material.dispose();
        }
      }
    };
  }, [colored, ghosts]);

  return (
    <>
      {colored.map((g, i) => (
        <mesh key={`colored-${i}`} geometry={g}>
          <meshBasicMaterial vertexColors />
        </mesh>
      ))}
      {ghosts.map((line, i) => (
        <primitive key={`ghost-${i}`} object={line} />
      ))}
    </>
  );
}

const CUBE_CAMERA: [number, number, number] = [1.3, 0.9, 1.7];

const SAMPLES_PER_ROTATION = 96;
const MIN_SAMPLES = 256;

export function CubeVisualization({ params, samples, resetSignal }: CubeVisualizationProps) {
  const effectiveSamples = useMemo(() => {
    if (samples != null) return samples;
    const absR = Math.abs(params.rotations);
    if (absR < 1) return MIN_SAMPLES;
    const perRotation = SAMPLES_PER_ROTATION;
    return Math.ceil(absR) * perRotation;
  }, [samples, params.rotations]);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const handleReset = () => {
    controlsRef.current?.reset();
  };
  useEffect(() => {
    if (resetSignal === undefined) return;
    controlsRef.current?.reset();
  }, [resetSignal]);
  return (
    <div className="cube-visualization">
      <button
        type="button"
        className="cube-reset"
        onClick={handleReset}
        title="Reset view"
        aria-label="Reset view"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.42A6 6 0 1 1 8 2v1z"
          />
          <path
            fill="currentColor"
            d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"
          />
        </svg>
      </button>
      <Canvas
        camera={{ position: CUBE_CAMERA, fov: 45 }}
        gl={{ toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        <group position={[-0.5, -0.5, -0.5]}>
          <CubeWireframe />
          <GrayDiagonal />
          <CornerMarkers />
          <Helix params={params} samples={effectiveSamples} />
        </group>
        <OrbitControls ref={controlsRef} enableDamping />
      </Canvas>
    </div>
  );
}
