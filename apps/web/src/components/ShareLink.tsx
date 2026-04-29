import { useState } from "react";

type Status = "idle" | "copied" | "failed";

const FEEDBACK_MS = 1500;

export function ShareLink() {
  const [status, setStatus] = useState<Status>("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  };

  const label =
    status === "copied" ? "Copied!" : status === "failed" ? "Copy failed" : "Copy share link";

  return (
    <button type="button" className="share-link" onClick={copy} aria-live="polite">
      {label}
    </button>
  );
}
