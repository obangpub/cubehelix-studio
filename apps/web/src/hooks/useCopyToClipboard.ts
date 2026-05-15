import { useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "failed";

/** How long the transient `copied` / `failed` status shows before reverting. */
const FEEDBACK_MS = 1500;

/**
 * Clipboard-copy state machine. `copy(text)` writes to the clipboard and
 * surfaces a transient `copied` or `failed` status that reverts to `idle`
 * after a short delay. Rapid calls reset the revert timer rather than racing,
 * and the pending timer is cleared on unmount.
 */
export function useCopyToClipboard() {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  };

  return { status, copy };
}
