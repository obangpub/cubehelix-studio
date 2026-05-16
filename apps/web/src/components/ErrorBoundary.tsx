import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render, lifecycle, and effect errors so a single failing subtree
 * cannot blank the whole app, and shows the error text on screen. The on-screen
 * detail is what makes a crash diagnosable on a mobile browser, where no
 * desktop inspector is available.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="error-boundary" role="alert">
        <h1>Something crashed</h1>
        <p className="error-boundary-message">
          {error.name}: {error.message}
        </p>
        {error.stack && <pre className="error-boundary-stack">{error.stack}</pre>}
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
