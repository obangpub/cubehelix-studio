import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { cubehelixRaw, type CubehelixParams, type RGB } from "@cubehelix-studio/core";

interface CubeVisualizationProps {
  params: CubehelixParams;
  samples?: number;
}

interface Sample {
  t: number;
  raw: RGB;
  clamped: RGB;
  inGamut: boolean;
}

const TUBE_RADIUS = 0.01;
const COLOR_RADIAL_SEGMENTS = 8;
const GHOST_RADIUS = 0.008;
const GHOST_RADIAL_SEGMENTS = 4;
const GHOST_EMERGE_SAMPLES = 4;
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

function makeSample(t: number, params: CubehelixParams): Sample {
  const raw = cubehelixRaw(t, params);
  const clamped = { r: clamp01(raw.r), g: clamp01(raw.g), b: clamp01(raw.b) };
  return { t, raw, clamped, inGamut: isInGamut(raw) };
}

function bisectCrossing(tLo: number, tHi: number, inLo: boolean, params: CubehelixParams): number {
  let lo = tLo;
  let hi = tHi;
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
  const base: Sample[] = [];
  for (let i = 0; i <= n; i++) {
    base.push(makeSample(i / n, params));
  }
  const out: Sample[] = [base[0]!];
  for (let i = 0; i < n; i++) {
    const a = base[i]!;
    const b = base[i + 1]!;
    if (a.inGamut !== b.inGamut) {
      const tCross = bisectCrossing(a.t, b.t, a.inGamut, params);
      out.push(makeSample(tCross, params));
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
  colored: THREE.BufferGeometry;
  ghosts: THREE.BufferGeometry[];
}

function buildScene(samples: Sample[], gamma: number): ScenePieces {
  const positions = samples.map((s) => sampleToVec(s.clamped));
  const cols = samples.map((s) => s.clamped);
  const colored = buildColoredTube(positions, cols, TUBE_RADIUS, COLOR_RADIAL_SEGMENTS, true);

  const ghosts: THREE.BufferGeometry[] = [];
  let runStart = -1;
  for (let i = 0; i <= samples.length; i++) {
    const s = samples[i];
    const out = s !== undefined && !s.inGamut;
    if (out && runStart === -1) runStart = i;
    if ((!out || i === samples.length) && runStart !== -1) {
      const start = Math.max(0, runStart - 1 - GHOST_EMERGE_SAMPLES);
      const end = Math.min(samples.length - 1, i + GHOST_EMERGE_SAMPLES);
      if (end - start >= 1) {
        const runSamples = samples.slice(start, end + 1);
        const ghostPositions = runSamples.map((rs) => sampleToVec(rs.raw));
        const ghostCols: RGB[] = runSamples.map((rs) => {
          const l = clamp01(Math.pow(rs.t, gamma));
          return { r: l, g: l, b: l };
        });
        ghosts.push(
          buildColoredTube(ghostPositions, ghostCols, GHOST_RADIUS, GHOST_RADIAL_SEGMENTS),
        );
      }
      runStart = -1;
    }
  }

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
    return buildScene(s, params.gamma);
  }, [params, samples]);

  useEffect(() => {
    return () => {
      colored.dispose();
      for (const g of ghosts) g.dispose();
    };
  }, [colored, ghosts]);

  return (
    <>
      <mesh geometry={colored}>
        <meshBasicMaterial vertexColors />
      </mesh>
      {ghosts.map((g, i) => (
        <mesh key={`ghost-${i}`} geometry={g}>
          <meshBasicMaterial vertexColors wireframe transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

export function CubeVisualization({ params, samples = 256 }: CubeVisualizationProps) {
  return (
    <div className="cube-visualization">
      <Canvas
        camera={{ position: [1.8, 1.4, 2.2], fov: 45 }}
        gl={{ toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        <CubeWireframe />
        <GrayDiagonal />
        <CornerMarkers />
        <Helix params={params} samples={samples} />
        <OrbitControls target={[0.5, 0.5, 0.5]} enableDamping />
      </Canvas>
    </div>
  );
}
