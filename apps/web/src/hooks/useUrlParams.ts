import { useCallback, useEffect, useState } from "react";
import { decodeAppState, encodeAppState, type AppState } from "../lib/url-state";

type SetAppState = (next: AppState | ((prev: AppState) => AppState)) => void;

// A slider drag changes `state` ~60x/second. Rewriting the URL on every change
// trips iOS Safari's history-API rate limit (~100 replaceState calls per 30s),
// which throws a SecurityError and tears down the app. Debounce the write so it
// lands once, shortly after the interaction settles. Rendering is unaffected:
// the live palette is driven by `state`, not by the URL.
const URL_SYNC_DEBOUNCE_MS = 300;

export function useUrlParams(): readonly [AppState, SetAppState] {
  const [state, setState] = useState<AppState>(() => decodeAppState(window.location.search));

  useEffect(() => {
    const timer = setTimeout(() => {
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
    }, URL_SYNC_DEBOUNCE_MS);
    // A new `state` before the timer fires cancels the pending write, so a
    // drag produces exactly one URL update once it settles.
    return () => clearTimeout(timer);
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
