import { useMemo, useState } from "react";
import {
  DEFAULT_ROLES,
  serialize,
  type CubehelixParams,
  type ExportFormat,
  type PaletteRole,
  type RolePalette,
} from "@cubehelix-studio/core";

interface ExportPanelProps {
  params: CubehelixParams;
  swatchCount: number;
}

function rolesForCount(count: number): PaletteRole[] {
  if (count === DEFAULT_ROLES.length) return DEFAULT_ROLES;
  if (count < 2) return [{ name: "1", t: 0 }];
  return Array.from({ length: count }, (_, i) => ({
    name: String(i + 1),
    t: i / (count - 1),
  }));
}

interface FormatOption {
  value: ExportFormat;
  label: string;
  language: string;
}

const FORMATS: FormatOption[] = [
  { value: "css", label: "CSS variables", language: "css" },
  { value: "tailwind", label: "Tailwind v4", language: "css" },
  { value: "scss", label: "SCSS", language: "scss" },
  { value: "json", label: "JSON tokens", language: "json" },
  { value: "python", label: "Python (matplotlib)", language: "python" },
];

const COPY_FEEDBACK_MS = 1500;

export function ExportPanel({ params, swatchCount }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const palette: RolePalette = useMemo(
    () => ({ params, roles: rolesForCount(swatchCount) }),
    [params, swatchCount],
  );

  const output = useMemo(() => serialize(palette, format), [palette, format]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    setTimeout(() => setCopyStatus("idle"), COPY_FEEDBACK_MS);
  };

  const copyLabel =
    copyStatus === "copied" ? "Copied!" : copyStatus === "failed" ? "Copy failed" : "Copy";

  return (
    <section className="export-panel" aria-label="Export palette">
      <header className="export-panel-header">
        <div className="export-panel-tabs" role="tablist">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={format === f.value}
              className={`export-panel-tab ${format === f.value ? "is-active" : ""}`}
              onClick={() => setFormat(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" className="export-panel-copy" onClick={copy} aria-live="polite">
          {copyLabel}
        </button>
      </header>
      <pre className="export-panel-output">
        <code>{output}</code>
      </pre>
    </section>
  );
}
