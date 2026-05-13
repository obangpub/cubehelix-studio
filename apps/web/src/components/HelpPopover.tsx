import type { ReactNode } from "react";

interface HelpPopoverProps {
  label: string;
  children: ReactNode;
}

export function HelpPopover({ label, children }: HelpPopoverProps) {
  return (
    <details className="info-popover">
      <summary className="info-popover-trigger" aria-label={label} title={label}>
        ?
      </summary>
      <div className="info-popover-content" role="tooltip">
        {children}
      </div>
    </details>
  );
}
