import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface HelpPopoverProps {
  label: string;
  children: ReactNode;
}

// Renders the popover content via a portal into document.body so the
// content lives outside the .layout-controls CSS-columns container. Without
// this, a popover that opens near the bottom of a column gets fragmented
// and its tail is re-rendered at the top of the next column over whatever
// sits there.
export function HelpPopover({ label, children }: HelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (contentRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="info-popover-trigger"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        ?
      </button>
      {open &&
        coords !== null &&
        createPortal(
          <div
            ref={contentRef}
            className="info-popover-content"
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
