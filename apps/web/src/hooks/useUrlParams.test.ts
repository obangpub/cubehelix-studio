// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useUrlParams } from "./useUrlParams";

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useUrlParams URL sync", () => {
  test("coalesces a burst of state changes into a single URL write", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => useUrlParams());

    // Stand in for a slider drag: many state changes in quick succession.
    for (let rotations = 1; rotations <= 40; rotations++) {
      act(() => {
        result.current[1]((prev) => ({
          ...prev,
          params: { ...prev.params, rotations },
        }));
      });
    }

    // Mid-drag the URL is untouched. Without debouncing this would already be
    // 40 writes — the burst that trips iOS Safari's history rate limit.
    expect(replaceState).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Exactly one write lands once the drag settles.
    expect(replaceState).toHaveBeenCalledTimes(1);

    replaceState.mockRestore();
  });

  test("clears a pending URL write on unmount", () => {
    const { result, unmount } = renderHook(() => useUrlParams());
    act(() => {
      result.current[1]((prev) => ({
        ...prev,
        params: { ...prev.params, rotations: 7 },
      }));
    });
    expect(vi.getTimerCount()).toBe(1); // the debounced write is armed
    unmount();
    expect(vi.getTimerCount()).toBe(0); // the cleanup cleared it
  });
});
