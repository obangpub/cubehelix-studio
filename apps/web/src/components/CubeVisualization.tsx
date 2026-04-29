import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { cubehelixRaw, type CubehelixParams, type RGB } from "@cubehelix-studio/core";

interface CubeVisualizationProps {
  params: CubehelixParams;
  samples?: number;
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
const GHOST_RADIUS = 0.009;
const GHOST_RADIAL_SEGMENTS = 3;
const BISECT_ITER = 6;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function srgbToLinear(c: number): number {
  if (c <= 0.04045) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
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
  const fullHelixParams: CubehelixParams = { ...params, lightnessMin: 0, lightnessMax: 1 };
  const invGamma = 1 / params.gamma;
  const uMin = Math.pow(params.lightnessMin, invGamma);
  const uMax = Math.pow(params.lightnessMax, invGamma);

  const makeAt = (u: number): Sample => {
    const raw = cubehelixRaw(u, fullHelixParams);
    const clamped = { r: clamp01(raw.r), g: clamp01(raw.g), b: clamp01(raw.b) };
    return {
      u,
      raw,
      clamped,
      inGamut: isInGamut(raw),
      inRange: u >= uMin && u <= uMax,
    };
  };

  const base: Sample[] = [];
  for (let i = 0; i <= n; i++) {
    base.push(makeAt(i / n));
  }

  const breakpoints: number[] = [];
  if (uMin > 0 && uMin < 1) breakpoints.push(uMin);
  if (uMax > uMin && uMax > 0 && uMax < 1) breakpoints.push(uMax);
  for (const u of breakpoints) {
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

function sampleToVec(c: RGB): THREE.Vector3 {
  return new THREE.Vector3(c.r, c.g, c.b);
}

interface ScenePieces {
  colored: THREE.BufferGeometry[];
  ghosts: THREE.BufferGeometry[];
}

type Category = "colored" | "ghost";

function categoryOf(s: Sample): Category {
  return s.inGamut && s.inRange ? "colored" : "ghost";
}

function pushRun(
  run: Sample[],
  cat: Category,
  colored: THREE.BufferGeometry[],
  ghosts: THREE.BufferGeometry[],
): void {
  if (run.length < 2) return;
  if (cat === "colored") {
    const positions = run.map((s) => sampleToVec(s.clamped));
    const cols = run.map((s) => s.clamped);
    colored.push(buildColoredTube(positions, cols, TUBE_RADIUS, COLOR_RADIAL_SEGMENTS, true));
  } else {
    const positions = run.map((s) => sampleToVec(s.raw));
    const ghostCols: RGB[] = run.map(() => ({ r: 1, g: 1, b: 1 }));
    ghosts.push(buildColoredTube(positions, ghostCols, GHOST_RADIUS, GHOST_RADIAL_SEGMENTS));
  }
}

function buildScene(samples: Sample[]): ScenePieces {
  const colored: THREE.BufferGeometry[] = [];
  const ghosts: THREE.BufferGeometry[] = [];
  if (samples.length < 2) return { colored, ghosts };

  let runStart = 0;
  let cur = categoryOf(samples[0]!);
  for (let i = 1; i < samples.length; i++) {
    const next = categoryOf(samples[i]!);
    if (next !== cur) {
      pushRun(samples.slice(runStart, i + 1), cur, colored, ghosts);
      runStart = i;
      cur = next;
    }
  }
  pushRun(samples.slice(runStart), cur, colored, ghosts);
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
      for (const g of ghosts) g.dispose();
    };
  }, [colored, ghosts]);

  return (
    <>
      {colored.map((g, i) => (
        <mesh key={`colored-${i}`} geometry={g}>
          <meshBasicMaterial vertexColors />
        </mesh>
      ))}
      {ghosts.map((g, i) => (
        <mesh key={`ghost-${i}`} geometry={g}>
          <meshBasicMaterial vertexColors wireframe transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}

const CUBE_CAMERA: [number, number, number] = [1.3, 0.9, 1.7];

export function CubeVisualization({ params, samples = 256 }: CubeVisualizationProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const handleReset = () => {
    controlsRef.current?.reset();
  };
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
          <Helix params={params} samples={samples} />
        </group>
        <OrbitControls ref={controlsRef} enableDamping />
      </Canvas>
    </div>
  );
}
