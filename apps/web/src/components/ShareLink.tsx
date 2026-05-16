import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { CopyFeedback } from "./CopyFeedback";
import { CheckIcon, LinkIcon } from "./icons";

export function ShareLink() {
  const { status, copy } = useCopyToClipboard();

  const tooltip =
    status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy permalink";

  return (
    <button
      type="button"
      className="header-icon-button"
      onClick={() => copy(window.location.href)}
      aria-label={tooltip}
      title={tooltip}
    >
      {status === "copied" ? <CheckIcon /> : <LinkIcon />}
      <span className="visually-hidden" aria-live="polite">
        {tooltip}
      </span>
      <CopyFeedback status={status} />
    </button>
  );
}
