import { useRef, type PointerEvent } from "react";

export interface PointerDragOptions<T extends Element> {
  /** Called on pointer-down and on every move while the drag is live. */
  onDrag: (e: PointerEvent<T>) => void;
  /** Called once when a drag begins, before the first `onDrag`. */
  onStart?: (e: PointerEvent<T>) => void;
  /** Called once when a drag ends, on pointer up or cancel. */
  onEnd?: (e: PointerEvent<T>) => void;
  /** Call `preventDefault()` on pointer-down to suppress text selection. */
  preventDefault?: boolean;
  /** Call `stopPropagation()` on pointer-down, for a handle inside a draggable parent. */
  stopPropagation?: boolean;
}

/**
 * Pointer-drag handlers built around a ref-tracked "is dragging" flag rather
 * than `hasPointerCapture`. The browser can silently drop pointer capture
 * mid-drag (focus loss, capture stolen by another element, a reconciliation
 * race); the ref survives all of that, so a drag never gets stuck. The hook
 * still calls `setPointerCapture` so move events keep routing to the element
 * when the cursor leaves its bounding box.
 *
 * The returned handlers are recreated each render and intentionally not
 * memoized — spread them onto a JSX element (`<el {...drag} />`) so the latest
 * `onDrag`/`onStart`/`onEnd` closures are always used. Do not pass them to
 * `addEventListener` or a memoized child, where a stable identity is expected.
 */
export function usePointerDrag<T extends Element>(options: PointerDragOptions<T>) {
  const { onDrag, onStart, onEnd, preventDefault, stopPropagation } = options;
  const draggingRef = useRef(false);

  const onPointerDown = (e: PointerEvent<T>): void => {
    if (preventDefault) e.preventDefault();
    if (stopPropagation) e.stopPropagation();
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail in odd states (already captured by another element);
      // the ref-based gate keeps the drag working regardless.
    }
    onStart?.(e);
    onDrag(e);
  };

  const onPointerMove = (e: PointerEvent<T>): void => {
    if (!draggingRef.current) return;
    onDrag(e);
  };

  const onPointerUp = (e: PointerEvent<T>): void => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onEnd?.(e);
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}
