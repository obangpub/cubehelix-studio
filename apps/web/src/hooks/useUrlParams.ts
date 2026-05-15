import { useCallback, useEffect, useRef, useState } from "react";
import { decodeAppState, encodeAppState, type AppState } from "../lib/url-state";

type SetAppState = (next: AppState | ((prev: AppState) => AppState)) => void;

export function useUrlParams(): readonly [AppState, SetAppState] {
  const [state, setState] = useState<AppState>(() => decodeAppState(window.location.search));
  // Set when a popstate handler drives the next setState. Back/forward
  // navigation lands the user on an existing history entry; the encode effect
  // must not rewrite that entry's URL, which canonical normalization would.
  const skipNextEncodeRef = useRef(false);

  useEffect(() => {
    if (skipNextEncodeRef.current) {
      skipNextEncodeRef.current = false;
      return;
    }
    const qs = encodeAppState(state);
    const newUrl = window.location.pathname + qs + window.location.hash;
    if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [state]);

  useEffect(() => {
    const onPopState = () => {
      skipNextEncodeRef.current = true;
      setState(decodeAppState(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setStateStable = useCallback<SetAppState>((next) => {
    setState(next);
  }, []);

  return [state, setStateStable] as const;
}
