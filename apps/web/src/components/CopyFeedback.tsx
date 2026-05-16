import type { CopyStatus } from "../hooks/useCopyToClipboard";

/**
 * Transient bubble shown next to a copy button to visually confirm a copy.
 * Purely visual and `aria-hidden`: screen readers get the parallel
 * `aria-live` announcement instead. Renders nothing while idle.
 */
export function CopyFeedback({ status }: { status: CopyStatus }) {
  if (status === "idle") return null;
  return (
    <span className="copy-feedback" aria-hidden="true">
      {status === "copied" ? "Copied!" : "Copy failed"}
    </span>
  );
}
