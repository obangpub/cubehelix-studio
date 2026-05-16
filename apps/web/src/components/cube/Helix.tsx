import { useEffect, useMemo } from "react";
import type { CubehelixParams, PreviewMode } from "@cubehelix-studio/core";
import { buildScene } from "../../lib/cube-geometry";
import { buildSamples } from "../../lib/helix-samples";

interface HelixProps {
  params: CubehelixParams;
  samples: number;
  showGhost: boolean;
  ghostColor: number;
  previewMode: PreviewMode;
}

/** The cubehelix path through the cube: a colored tube for the in-gamut,
 *  in-range run plus dashed ghost lines where it leaves gamut or range. */
export function Helix({ params, samples, showGhost, ghostColor, previewMode }: HelixProps) {
  const { colored, ghosts } = useMemo(() => {
    const s = buildSamples(params, samples);
    return buildScene(s, ghostColor, previewMode);
  }, [params, samples, ghostColor, previewMode]);

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
