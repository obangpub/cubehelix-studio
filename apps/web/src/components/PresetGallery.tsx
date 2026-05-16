import { useId, useMemo } from "react";
import {
  cubehelix,
  PRESETS,
  toCssRgb,
  type CubehelixParams,
  type Preset,
} from "@cubehelix-studio/core";
import { useAnnounce } from "../lib/announcer";
import { paramsEqual } from "../lib/preset-match";

const STOP_COUNT = 32;

interface PresetGalleryProps {
  params: CubehelixParams;
  onSelect: (params: CubehelixParams) => void;
}

export function PresetGallery({ params, onSelect }: PresetGalleryProps) {
  const activeId = PRESETS.find((p) => paramsEqual(p.params, params))?.id;
  return (
    <section className="controls">
      <details className="control-section" open>
        <summary className="control-section-header">
          <span className="control-section-title">Presets</span>
          <span className="control-section-chevron" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="control-section-body">
          <div className="preset-gallery" role="group" aria-label="Palette presets">
            {PRESETS.map((preset) => (
              <PresetTile
                key={preset.id}
                preset={preset}
                active={preset.id === activeId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}

interface PresetTileProps {
  preset: Preset;
  active: boolean;
  onSelect: (params: CubehelixParams) => void;
}

function PresetTile({ preset, active, onSelect }: PresetTileProps) {
  const gradientId = useId();
  const announce = useAnnounce();
  const stops = useMemo(() => {
    return Array.from({ length: STOP_COUNT + 1 }, (_, i) => {
      const t = i / STOP_COUNT;
      return { offset: t, color: toCssRgb(cubehelix(t, preset.params)) };
    });
  }, [preset]);

  return (
    <button
      type="button"
      className={`preset-tile ${active ? "is-active" : ""}`}
      aria-current={active ? "true" : undefined}
      onClick={() => {
        onSelect(preset.params);
        announce(`Loaded ${preset.name} preset`);
      }}
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
