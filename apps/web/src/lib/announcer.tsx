import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// A single app-level polite live region. Components call `useAnnounce()` to
// push short status messages (preset loaded, theme changed, preview lens
// switched) so screen-reader users hear transitions that are otherwise only
// visible.
const AnnouncerContext = createContext<(message: string) => void>(() => {});

export function useAnnounce(): (message: string) => void {
  return useContext(AnnouncerContext);
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");

  const announce = useCallback((next: string) => {
    // Clear first so re-announcing the same string still triggers the live
    // region; the empty render and the real render land in separate commits.
    setMessage("");
    requestAnimationFrame(() => setMessage(next));
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" className="visually-hidden">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}
