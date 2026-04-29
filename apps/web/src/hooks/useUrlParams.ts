import { useCallback, useEffect, useState } from "react";
import type { CubehelixParams } from "@cubehelix-studio/core";
import { decodeParams, encodeParams } from "../lib/url-state";

type SetParams = (next: CubehelixParams | ((prev: CubehelixParams) => CubehelixParams)) => void;

export function useUrlParams(): readonly [CubehelixParams, SetParams] {
  const [params, setParams] = useState<CubehelixParams>(() => decodeParams(window.location.search));

  useEffect(() => {
    const qs = encodeParams(params);
    const newUrl = window.location.pathname + qs + window.location.hash;
    if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [params]);

  useEffect(() => {
    const onPopState = () => {
      setParams(decodeParams(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setParamsStable = useCallback<SetParams>((next) => {
    setParams(next);
  }, []);

  return [params, setParamsStable] as const;
}
