import { useCallback, useEffect, useState } from "react";
import { decodeAppState, encodeAppState, type AppState } from "../lib/url-state";

type SetAppState = (next: AppState | ((prev: AppState) => AppState)) => void;

export function useUrlParams(): readonly [AppState, SetAppState] {
  const [state, setState] = useState<AppState>(() => decodeAppState(window.location.search));

  useEffect(() => {
    const qs = encodeAppState(state);
    const newUrl = window.location.pathname + qs + window.location.hash;
    if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [state]);

  useEffect(() => {
    const onPopState = () => {
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
