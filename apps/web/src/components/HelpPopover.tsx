import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface HelpPopoverProps {
  label: string;
  children: ReactNode;
}

const POPOVER_HALF_WIDTH = 140;
const VIEWPORT_MARGIN = 8;

// Renders the popover content via a portal into document.body so the
// content lives outside the .layout-controls CSS-columns container. Without
// this, a popover that opens near the bottom of a column gets fragmented
// and its tail is re-rendered at the top of the next column over whatever
// sits there.
export function HelpPopover({ label, children }: HelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      // Keep the (center-anchored) content within the viewport horizontally.
      const halfWidth = Math.min(POPOVER_HALF_WIDTH, (window.innerWidth - 32) / 2);
      const rawLeft = rect.left + rect.width / 2;
      const left = Math.max(
        halfWidth + VIEWPORT_MARGIN,
        Math.min(rawLeft, window.innerWidth - halfWidth - VIEWPORT_MARGIN),
      );
      // Prefer below the trigger; flip above when the content would overflow
      // the viewport bottom and there is room above. Content height is only
      // known after the first mount, hence the rAF re-run below.
      const contentH = contentRef.current?.offsetHeight ?? 0;
      const below = rect.bottom + VIEWPORT_MARGIN;
      const flip =
        contentH > 0 &&
        below + contentH > window.innerHeight - VIEWPORT_MARGIN &&
        rect.top - VIEWPORT_MARGIN - contentH >= VIEWPORT_MARGIN;
      const top = flip ? rect.top - VIEWPORT_MARGIN - contentH : below;
      setCoords({ top, left });
    };
    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
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
        aria-describedby={open ? contentId : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        ?
      </button>
      {open &&
        coords !== null &&
        createPortal(
          <div
            ref={contentRef}
            id={contentId}
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
