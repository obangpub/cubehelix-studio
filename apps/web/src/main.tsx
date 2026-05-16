import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { installErrorOverlay } from "./lib/error-overlay";
import "./styles.css";

installErrorOverlay();

const root = document.getElementById("root");
if (!root) {
  throw new Error("missing #root mount point");
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
