import { useEffect, useMemo } from "react";
import * as THREE from "three";

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

/** The black-to-white diagonal, split into the visible window and the dashed
 *  out-of-window "ghost" segments, with optional draggable-looking handles. */
export function LightnessAxis({
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
