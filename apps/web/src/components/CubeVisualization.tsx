import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import {
  cubehelixRaw,
  evaluateLightnessCurve,
  invertLightnessCurve,
  type CubehelixParams,
  type RGB,
} from "@cubehelix-studio/core";

interface CubeVisualizationProps {
  params: CubehelixParams;
  samples?: number;
  resetSignal?: number;
  cubeTheme: "light" | "dark";
  onCubeThemeChange: (next: "light" | "dark") => void;
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

function buildSamples(params: CubehelixParams, n: number): Sample[] {
  // Cube viz renders the full underlying helix as a fixed object in cube
  // space, parameterized over u in [0,1] from black to white, then marks
  // which segments fall in the user's visible lightness range. The visible
  // palette is the sub-arc where the curve output lies in [lightnessAxisMin,
  // lightnessAxisMax]. Stripping lightness-range AND reverse here lets cubehelixRaw
  // return colors at the helix parameter u directly: with range [0,1] and
  // reverse=false, the function's input t maps 1:1 to u. Keeping reverse here
  // would double-reverse and paint mismatched hues against the swatches.
  const fullHelixParams: CubehelixParams = {
    ...params,
    lightnessAxisMin: 0,
    lightnessAxisMax: 1,
    reverse: false,
  };
  const { lightnessCurve, lightnessAxisMin, lightnessAxisMax } = params;

  const makeAt = (u: number): Sample => {
    const raw = cubehelixRaw(u, fullHelixParams);
    const clamped = { r: clamp01(raw.r), g: clamp01(raw.g), b: clamp01(raw.b) };
    const lightness = evaluateLightnessCurve(lightnessCurve, u);
    return {
      u,
      raw,
      clamped,
      inGamut: isInGamut(raw),
      inRange: lightness >= lightnessAxisMin && lightness <= lightnessAxisMax,
    };
  };

  const base: Sample[] = [];
  for (let i = 0; i <= n; i++) {
    base.push(makeAt(i / n));
  }

  const breakpoints: number[] = [];
  if (lightnessAxisMin > 0)
    breakpoints.push(invertLightnessCurve(lightnessCurve, lightnessAxisMin));
  if (lightnessAxisMax < 1)
    breakpoints.push(invertLightnessCurve(lightnessCurve, lightnessAxisMax));
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

function buildScene(samples: Sample[], ghostColor: number): ScenePieces {
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
      ghosts.push(buildGhostLine(positions, ghostColor));
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

const AXIS_COLOR = 0x666666;
const AXIS_DASH_SIZE = 0.05;
const AXIS_GAP_SIZE = 0.03;
// Cube edge sized to sit fully inside the 0.025-radius corner spheres
// (cube diagonal = edge·√3, so edge < 2·0.025/√3 ≈ 0.029 fits entirely).
const AXIS_THUMB_SIZE = 0.025;

interface LightnessAxisProps {
  lightnessAxisMin: number;
  lightnessAxisMax: number;
  showAxis: boolean;
  showGhost: boolean;
  showHandles: boolean;
}

function LightnessAxis({
  lightnessAxisMin,
  lightnessAxisMax,
  showAxis,
  showGhost,
  showHandles,
}: LightnessAxisProps) {
  const lines = useMemo(() => {
    const segments: { from: number; to: number; dashed: boolean }[] = [];
    if (lightnessAxisMin > 0) {
      segments.push({ from: 0, to: lightnessAxisMin, dashed: true });
    }
    if (lightnessAxisMax > lightnessAxisMin) {
      segments.push({ from: lightnessAxisMin, to: lightnessAxisMax, dashed: false });
    }
    if (lightnessAxisMax < 1) {
      segments.push({ from: lightnessAxisMax, to: 1, dashed: true });
    }
    return segments.map((seg) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(seg.from, seg.from, seg.from),
        new THREE.Vector3(seg.to, seg.to, seg.to),
      ]);
      const material = seg.dashed
        ? new THREE.LineDashedMaterial({
            color: AXIS_COLOR,
            dashSize: AXIS_DASH_SIZE,
            gapSize: AXIS_GAP_SIZE,
          })
        : new THREE.LineBasicMaterial({ color: AXIS_COLOR });
      const line = new THREE.Line(geometry, material);
      if (seg.dashed) line.computeLineDistances();
      return { line, dashed: seg.dashed };
    });
  }, [lightnessAxisMin, lightnessAxisMax]);

  useEffect(() => {
    return () => {
      for (const { line } of lines) {
        line.geometry.dispose();
        if (Array.isArray(line.material)) {
          for (const m of line.material) m.dispose();
        } else {
          line.material.dispose();
        }
      }
    };
  }, [lines]);

  const vMin = Math.round(lightnessAxisMin * 255);
  const vMax = Math.round(lightnessAxisMax * 255);

  return (
    <>
      {lines.map(({ line, dashed }, i) => {
        if (dashed ? !showGhost : !showAxis) return null;
        return <primitive key={`axis-${i}`} object={line} />;
      })}
      {showHandles && (
        <>
          <mesh position={[lightnessAxisMin, lightnessAxisMin, lightnessAxisMin]}>
            <boxGeometry args={[AXIS_THUMB_SIZE, AXIS_THUMB_SIZE, AXIS_THUMB_SIZE]} />
            <meshBasicMaterial color={`rgb(${vMin}, ${vMin}, ${vMin})`} />
          </mesh>
          <mesh position={[lightnessAxisMax, lightnessAxisMax, lightnessAxisMax]}>
            <boxGeometry args={[AXIS_THUMB_SIZE, AXIS_THUMB_SIZE, AXIS_THUMB_SIZE]} />
            <meshBasicMaterial color={`rgb(${vMax}, ${vMax}, ${vMax})`} />
          </mesh>
        </>
      )}
    </>
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
  showGhost: boolean;
  ghostColor: number;
}

function Helix({ params, samples, showGhost, ghostColor }: HelixProps) {
  const { colored, ghosts } = useMemo(() => {
    const s = buildSamples(params, samples);
    return buildScene(s, ghostColor);
  }, [params, samples, ghostColor]);

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
      {showGhost && ghosts.map((line, i) => <primitive key={`ghost-${i}`} object={line} />)}
    </>
  );
}

const DEFAULT_CAMERA_POSITION: [number, number, number] = [1.3, 0.9, 1.7];
const ORTHO_ZOOM = 280;
const SNAP_DISTANCE = 2.5;

const SAMPLES_PER_ROTATION = 96;
const MIN_SAMPLES = 256;

type SnapId =
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

interface Snap {
  id: SnapId;
  label: string;
  group: "corner" | "face";
  dir: [number, number, number];
  up: [number, number, number];
  swatch: string;
}

const SNAPS: Snap[] = [
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

interface ViewSettings {
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

const DEFAULT_VIEW: ViewSettings = {
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

const VISIBILITY_KEYS = [
  "showCanvas",
  "showWireframe",
  "showVertices",
  "showAxis",
  "showAxisHandles",
  "showGhostAxis",
  "showGhostHelix",
] as const satisfies readonly (keyof ViewSettings)[];

function allVisible(view: ViewSettings): boolean {
  return VISIBILITY_KEYS.every((k) => view[k]);
}

function setAllVisibility(view: ViewSettings, value: boolean): ViewSettings {
  const next = { ...view };
  for (const k of VISIBILITY_KEYS) next[k] = value;
  return next;
}

interface CameraRigProps {
  projection: "perspective" | "orthographic";
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
  snap: { id: SnapId; signal: number } | null;
}

// Tracks the current camera position, up vector, and orbit target so projection
// switches preserve the view, and applies imperative snap-to-axis moves.
function CameraRig({ projection, controlsRef, snap }: CameraRigProps) {
  const positionRef = useRef<[number, number, number]>(DEFAULT_CAMERA_POSITION);
  const upRef = useRef<[number, number, number]>([0, 1, 0]);
  const targetRef = useRef<[number, number, number]>([0, 0, 0]);
  const { camera } = useThree();

  useFrame(() => {
    positionRef.current = [camera.position.x, camera.position.y, camera.position.z];
    upRef.current = [camera.up.x, camera.up.y, camera.up.z];
    const controls = controlsRef.current;
    if (controls) {
      targetRef.current = [controls.target.x, controls.target.y, controls.target.z];
    }
  });

  // When the active camera changes (projection swap), re-apply the tracked
  // view state on the new camera so position, up, and orbit target carry over.
  useEffect(() => {
    camera.position.set(...positionRef.current);
    camera.up.set(...upRef.current);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(...targetRef.current);
      controls.update();
    }
  }, [camera, controlsRef]);

  // Snap-to-axis fires only when the user clicks a snap button. Deps deliberately
  // exclude `camera` and `controlsRef` so projection swaps don't replay the last
  // snap (which would discard any orbit changes the user made since).
  useEffect(() => {
    if (!snap) return;
    const def = SNAPS.find((s) => s.id === snap.id);
    if (!def) return;
    const [dx, dy, dz] = def.dir;
    const norm = Math.hypot(dx, dy, dz);
    camera.position.set(
      (dx / norm) * SNAP_DISTANCE,
      (dy / norm) * SNAP_DISTANCE,
      (dz / norm) * SNAP_DISTANCE,
    );
    camera.up.set(def.up[0], def.up[1], def.up[2]);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update();
    // camera and controlsRef intentionally omitted; see comment above.
  }, [snap]);

  if (projection === "perspective") {
    return (
      <PerspectiveCamera key="perspective" makeDefault position={positionRef.current} fov={45} />
    );
  }
  return (
    <OrthographicCamera
      key="orthographic"
      makeDefault
      position={positionRef.current}
      zoom={ORTHO_ZOOM}
      near={0.1}
      far={100}
    />
  );
}

function ResetIcon() {
  return (
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
  );
}

function CogIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311a1.464 1.464 0 0 1-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.858 2.929 2.929 0 0 1 0 5.858z"
      />
    </svg>
  );
}

function AutoRotateIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 2.5a5.5 5.5 0 0 1 5.477 5h-1.51l2.017 2.5L16 7.5h-1.508a6.5 6.5 0 0 0-12.713-1.5h1.022A5.503 5.503 0 0 1 8 2.5zM8 13.5a5.5 5.5 0 0 1-5.477-5h1.51L2.016 6 0 8.5h1.508a6.5 6.5 0 0 0 12.713 1.5h-1.022A5.503 5.503 0 0 1 8 13.5z"
      />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        d="M8 1.5 14 4.5v7L8 14.5 2 11.5v-7zM8 1.5v6.5M8 8v6.5M8 8 2 4.5M8 8l6-3.5"
      />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 2.5v5M4.4 4.5a4.5 4.5 0 1 0 7.2 0"
      />
    </svg>
  );
}

type PanelId = "snaps" | "settings";

interface SnapPanelProps {
  onSnap: (id: SnapId) => void;
}

function SnapPanel({ onSnap }: SnapPanelProps) {
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

function SettingsPanel({ view, onChange }: SettingsPanelProps) {
  const allOn = allVisible(view);
  return (
    <div className="cube-panel" role="group" aria-label="Cube view settings">
      <div className="cube-panel-row">
        <span className="cube-panel-label">Projection</span>
        <div className="cube-segmented">
          {(["perspective", "orthographic"] as const).map((p) => (
            <label
              key={p}
              className={`cube-segmented-option ${view.projection === p ? "is-active" : ""}`}
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

function CubeToolbar({
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
          className={`cube-icon-button ${view.showCanvas ? "is-active" : ""}`}
          onClick={onCanvasToggle}
          aria-pressed={view.showCanvas}
          aria-label={view.showCanvas ? "Hide cube visualizer" : "Show cube visualizer"}
          title={view.showCanvas ? "Hide cube visualizer" : "Show cube visualizer"}
        >
          <PowerIcon />
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
          {cubeTheme === "dark" ? <SunIcon /> : <MoonIcon />}
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

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M14 8.5A6 6 0 1 1 7.5 2a4.667 4.667 0 0 0 6.5 6.5z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="2.6" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <line x1="8" y1="1.5" x2="8" y2="3.4" />
        <line x1="8" y1="12.6" x2="8" y2="14.5" />
        <line x1="1.5" y1="8" x2="3.4" y2="8" />
        <line x1="12.6" y1="8" x2="14.5" y2="8" />
        <line x1="3.39" y1="3.39" x2="4.74" y2="4.74" />
        <line x1="11.26" y1="11.26" x2="12.61" y2="12.61" />
        <line x1="3.39" y1="12.61" x2="4.74" y2="11.26" />
        <line x1="11.26" y1="4.74" x2="12.61" y2="3.39" />
      </g>
    </svg>
  );
}

const CUBE_BG_DARK = "#1a1a1a";
const CUBE_BG_LIGHT = "#f5f5f5";
const GHOST_COLOR_DARK = 0xffffff;
const GHOST_COLOR_LIGHT = 0x222222;

export function CubeVisualization({
  params,
  samples,
  resetSignal,
  cubeTheme,
  onCubeThemeChange,
}: CubeVisualizationProps) {
  const effectiveSamples = useMemo(() => {
    if (samples != null) return samples;
    const absR = Math.abs(params.rotations);
    if (absR < 1) return MIN_SAMPLES;
    const perRotation = SAMPLES_PER_ROTATION;
    return Math.ceil(absR) * perRotation;
  }, [samples, params.rotations]);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const [view, setView] = useState<ViewSettings>(DEFAULT_VIEW);
  const [snap, setSnap] = useState<{ id: SnapId; signal: number } | null>(null);
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);

  // Set view back to the original default explicitly rather than via
  // controls.reset(). drei re-binds OrbitControls to a new camera instance on
  // each projection swap, which re-captures the saved-state pose at swap time
  // — so reset() would restore whatever the camera happened to be at then,
  // not the original default. Setting all the state by hand makes reset
  // deterministic across projection switches.
  const resetViewRef = useRef<() => void>(() => {});
  resetViewRef.current = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object;
    cam.position.set(
      DEFAULT_CAMERA_POSITION[0],
      DEFAULT_CAMERA_POSITION[1],
      DEFAULT_CAMERA_POSITION[2],
    );
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
  };
  const handleReset = () => resetViewRef.current();
  useEffect(() => {
    if (resetSignal === undefined) return;
    resetViewRef.current();
  }, [resetSignal]);
  const handleSnap = (id: SnapId) => {
    setSnap((prev) => ({ id, signal: (prev?.signal ?? 0) + 1 }));
  };
  const togglePanel = (panel: PanelId) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };
  const toggleAutoRotate = () => {
    setView((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
  };
  const toggleCanvas = () => {
    setView((prev) => ({ ...prev, showCanvas: !prev.showCanvas }));
  };
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
