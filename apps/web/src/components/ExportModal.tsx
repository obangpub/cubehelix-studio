import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ROLES,
  serialize,
  type CubehelixParams,
  type ExportFormat,
  type PaletteRole,
  type RolePalette,
} from "@cubehelix-studio/core";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { useAnnounce } from "../lib/announcer";
import { CopyFeedback } from "./CopyFeedback";
import { CheckIcon, ClipboardIcon, CloseIcon } from "./icons";

interface ExportModalProps {
  params: CubehelixParams;
  swatchCount: number;
  open: boolean;
  onClose: () => void;
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
}

const FORMATS: FormatOption[] = [
  { value: "css", label: "CSS variables" },
  { value: "tailwind", label: "Tailwind v4" },
  { value: "scss", label: "SCSS" },
  { value: "json", label: "JSON tokens" },
  { value: "python", label: "Python (matplotlib)" },
];

export function ExportModal({ params, swatchCount, open, onClose }: ExportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<ExportFormat>("css");
  const { status: copyStatus, copy } = useCopyToClipboard();
  const announce = useAnnounce();
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const copyTooltip =
    copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy";

  return (
    <dialog
      ref={dialogRef}
      className="export-modal"
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby={`${baseId}-title`}
    >
      <div className="export-modal-content">
        <button type="button" className="export-modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        <h2 id={`${baseId}-title`}>Export</h2>
        <div className="export-panel-tabbar">
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
            onClick={() => copy(output)}
            aria-label={copyTooltip}
            title={copyTooltip}
          >
            {copyStatus === "copied" ? <CheckIcon /> : <ClipboardIcon />}
            <span className="visually-hidden" aria-live="polite">
              {copyTooltip}
            </span>
            <CopyFeedback status={copyStatus} />
          </button>
        </div>
        <pre
          className="export-panel-output"
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(format)}
          tabIndex={0}
        >
          <code>{output}</code>
        </pre>
      </div>
    </dialog>
  );
}
