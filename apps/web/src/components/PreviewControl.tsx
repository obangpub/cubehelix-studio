import { useId } from "react";
import { PREVIEW_MODES, type PreviewMode } from "@cubehelix-studio/core";
import { useAnnounce } from "../lib/announcer";

const LABELS: Record<PreviewMode, string> = {
  normal: "Normal",
  grayscale: "Grayscale",
  protanopia: "Protanopia",
  deuteranopia: "Deuteranopia",
  tritanopia: "Tritanopia",
};

// Abbreviated labels so all five options fit one row on a phone. The full
// names above remain each option's accessible name and spoken announcement.
const SHORT_LABELS: Record<PreviewMode, string> = {
  normal: "Norm",
  grayscale: "Grays",
  protanopia: "Protan",
  deuteranopia: "Deutan",
  tritanopia: "Tritan",
};

interface PreviewControlProps {
  value: PreviewMode;
  onChange: (next: PreviewMode) => void;
}

export function PreviewControl({ value, onChange }: PreviewControlProps) {
  const groupName = useId();
  const announce = useAnnounce();
  return (
    <div className="preview-control" role="radiogroup" aria-label="Preview palette as">
      <span className="preview-control-label">Preview as</span>
      <div className="segmented segmented--compact">
        {PREVIEW_MODES.map((mode) => (
          <label key={mode} className={`segmented-option ${value === mode ? "is-active" : ""}`}>
            <input
              type="radio"
              name={groupName}
              value={mode}
              checked={value === mode}
              aria-label={LABELS[mode]}
              onChange={() => {
                onChange(mode);
                announce(`Preview: ${LABELS[mode]}`);
              }}
            />
            <span>{SHORT_LABELS[mode]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
