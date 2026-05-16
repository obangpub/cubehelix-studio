import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ROLES,
  serialize,
  type CubehelixParams,
  type ExportFormat,
  type PaletteRole,
  type RolePalette,
} from "@cubehelix-studio/core";
import { useAnnounce } from "../lib/announcer";

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
  const announce = useAnnounce();
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const palette: RolePalette = useMemo(
    () => ({ params, roles: rolesForCount(swatchCount) }),
    [params, swatchCount],
  );

  const output = useMemo(() => serialize(palette, format), [palette, format]);

  const tabId = (value: ExportFormat) => `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel`;

  const selectFormat = (value: ExportFormat) => {
    setFormat(value);
    const label = FORMATS.find((f) => f.value === value)?.label ?? value;
    announce(`Export format: ${label}`);
  };

  // Roving tab navigation: arrows move focus and selection together.
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number;
    switch (e.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % FORMATS.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + FORMATS.length) % FORMATS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = FORMATS.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    selectFormat(FORMATS[nextIndex]!.value);
    tabRefs.current[nextIndex]?.focus();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    // Reset any in-flight revert timer so rapid clicks don't race.
    if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyStatus("idle"), COPY_FEEDBACK_MS);
  };

  const copyTooltip =
    copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy";

  return (
    <section className="export-panel" aria-label="Export palette">
      <header className="export-panel-header">
        <div className="export-panel-tabs" role="tablist" aria-label="Export format">
          {FORMATS.map((f, i) => (
            <button
              key={f.value}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={tabId(f.value)}
              aria-selected={format === f.value}
              aria-controls={panelId}
              tabIndex={format === f.value ? 0 : -1}
              className={`export-panel-tab ${format === f.value ? "is-active" : ""}`}
              onClick={() => selectFormat(f.value)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="header-icon-button"
          onClick={copy}
          aria-label={copyTooltip}
          title={copyTooltip}
        >
          {copyStatus === "copied" ? <CheckIcon /> : <ClipboardIcon />}
          <span className="visually-hidden" aria-live="polite">
            {copyTooltip}
          </span>
        </button>
      </header>
      <pre
        className="export-panel-output"
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(format)}
        tabIndex={0}
      >
        <code>{output}</code>
      </pre>
    </section>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect
        x="8"
        y="3"
        width="8"
        height="3"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12l5 5L20 7"
      />
    </svg>
  );
}
