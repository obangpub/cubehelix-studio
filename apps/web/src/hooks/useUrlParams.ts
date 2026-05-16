import { useCallback, useEffect, useState } from "react";
import { decodeAppState, encodeAppState, type AppState } from "../lib/url-state";

type SetAppState = (next: AppState | ((prev: AppState) => AppState)) => void;

export function useUrlParams(): readonly [AppState, SetAppState] {
  const [state, setState] = useState<AppState>(() => decodeAppState(window.location.search));

  useEffect(() => {
    const qs = encodeAppState(state);
    // Write only when `state` genuinely differs from what the URL already
    // represents. Comparing canonical encodings — `qs` against a re-encode of
    // the current URL — leaves a back/forward navigation alone (it decodes
    // state straight from the URL we are on, so the two encodings match) and
    // also avoids rewriting a non-canonical incoming link. Only a real edit
    // changes the encoding, and only that rewrites the entry.
    if (qs === encodeAppState(decodeAppState(window.location.search))) return;
    const newUrl = window.location.pathname + qs + window.location.hash;
    window.history.replaceState(null, "", newUrl);
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
