/**
 * A DOM-level error log that lives outside React's root, so it keeps showing
 * even if React unmounts the tree. It catches errors and promise rejections
 * that a React error boundary does not — event handlers and async code — and
 * is a diagnostic aid for debugging on devices with no desktop inspector.
 *
 * Temporary: remove once the iOS slider crash is resolved.
 */
export function installErrorOverlay(): void {
  const el = document.createElement("div");
  el.style.cssText = [
    "position:fixed",
    "left:0",
    "right:0",
    "bottom:0",
    "z-index:99999",
    "max-height:50vh",
    "overflow:auto",
    "margin:0",
    "padding:12px",
    "background:#fff3f3",
    "color:#900",
    "font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace",
    "white-space:pre-wrap",
    "word-break:break-word",
    "border-top:3px solid #c00",
    "display:none",
  ].join(";");
  document.body.appendChild(el);

  const show = (text: string): void => {
    el.style.display = "block";
    el.textContent = `${el.textContent ?? ""}\n${text}`.trim();
  };

  window.addEventListener("error", (e) => {
    show(`error: ${e.message}\n${e.error?.stack ?? `${e.filename}:${e.lineno}:${e.colno}`}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason as { stack?: string; message?: string } | undefined;
    show(`unhandledrejection: ${reason?.stack ?? reason?.message ?? String(e.reason)}`);
  });
}
