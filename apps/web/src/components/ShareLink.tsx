import { useEffect, useRef, useState } from "react";

type Status = "idle" | "copied" | "failed";

const FEEDBACK_MS = 1500;

export function ShareLink() {
  const [status, setStatus] = useState<Status>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    // Reset any in-flight revert timer so rapid clicks don't race.
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  };

  const tooltip =
    status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy permalink";

  return (
    <button
      type="button"
      className="header-icon-button"
      onClick={copy}
      aria-label={tooltip}
      title={tooltip}
    >
      {status === "copied" ? <CheckIcon /> : <LinkIcon />}
      <span className="visually-hidden" aria-live="polite">
        {tooltip}
      </span>
    </button>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
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
