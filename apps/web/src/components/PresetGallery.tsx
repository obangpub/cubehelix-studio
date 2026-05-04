import { useId, useMemo } from "react";
import {
  cubehelix,
  PRESETS,
  toCssRgb,
  type CubehelixParams,
  type Preset,
} from "@cubehelix-studio/core";

const STOP_COUNT = 32;

interface PresetGalleryProps {
  onSelect: (params: CubehelixParams) => void;
}

export function PresetGallery({ onSelect }: PresetGalleryProps) {
  return (
    <div className="preset-gallery" role="group" aria-label="Palette presets">
      {PRESETS.map((preset) => (
        <PresetTile key={preset.id} preset={preset} onSelect={onSelect} />
      ))}
    </div>
  );
}

interface PresetTileProps {
  preset: Preset;
  onSelect: (params: CubehelixParams) => void;
}

function PresetTile({ preset, onSelect }: PresetTileProps) {
  const gradientId = useId();
  const stops = useMemo(() => {
    return Array.from({ length: STOP_COUNT + 1 }, (_, i) => {
      const t = i / STOP_COUNT;
      return { offset: t, color: toCssRgb(cubehelix(t, preset.params)) };
    });
  }, [preset]);

  return (
    <button
      type="button"
      className="preset-tile"
      onClick={() => onSelect(preset.params)}
      title={preset.description}
      aria-label={`Load ${preset.name} preset: ${preset.description}`}
    >
      <svg
        className="preset-tile-gradient"
        aria-hidden="true"
        width="100%"
        height="24"
        preserveAspectRatio="none"
        viewBox="0 0 100 1"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            {stops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
        <rect width="100" height="1" fill={`url(#${gradientId})`} />
      </svg>
      <span className="preset-tile-name">{preset.name}</span>
    </button>
  );
}
