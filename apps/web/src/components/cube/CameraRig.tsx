import { useEffect, useRef, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { DEFAULT_CAMERA_POSITION, ORTHO_ZOOM, SNAP_DISTANCE, SNAPS, type SnapId } from "./view";

interface CameraRigProps {
  projection: "perspective" | "orthographic";
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
  snap: { id: SnapId; signal: number } | null;
}

/** Tracks the current camera position, up vector, and orbit target so
 *  projection switches preserve the view, and applies imperative
 *  snap-to-axis moves. */
export function CameraRig({ projection, controlsRef, snap }: CameraRigProps) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- camera and controlsRef are omitted by design (see the comment above the effect).
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
