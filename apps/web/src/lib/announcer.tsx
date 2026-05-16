import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
  const frameRef = useRef<number | null>(null);

  const announce = useCallback((next: string) => {
    // Clear first so re-announcing the same string still triggers the live
    // region; the empty render and the real render land in separate commits.
    // Cancel any frame still pending from an earlier call so back-to-back
    // announcements coalesce to the latest message instead of one blanking
    // the other before assistive tech reads it.
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    setMessage("");
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      setMessage(next);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
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
