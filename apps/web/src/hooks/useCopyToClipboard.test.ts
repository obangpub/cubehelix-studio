// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useCopyToClipboard } from "./useCopyToClipboard";

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useCopyToClipboard", () => {
  test("starts idle", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.status).toBe("idle");
  });

  test("copy writes the text to the clipboard and reports copied", async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy("hello");
    });
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current.status).toBe("copied");
  });

  test("status reverts to idle after the feedback delay", async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy("hello");
    });
    expect(result.current.status).toBe("copied");
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.status).toBe("idle");
  });

  test("reports failed when the clipboard write rejects", async () => {
    writeText.mockRejectedValueOnce(new Error("permission denied"));
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy("hello");
    });
    expect(result.current.status).toBe("failed");
  });

  test("a second copy resets the revert timer instead of racing the first", async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy("first");
    });
    act(() => {
      vi.advanceTimersByTime(1000); // partway through the first revert
    });
    expect(result.current.status).toBe("copied");

    await act(async () => {
      await result.current.copy("second");
    });
    act(() => {
      vi.advanceTimersByTime(1000); // the first timer's deadline (1500) passes
    });
    // Still "copied": the second copy cleared the first timer rather than
    // letting it fire and revert mid-feedback.
    expect(result.current.status).toBe("copied");

    act(() => {
      vi.advanceTimersByTime(500); // 1500ms since the second copy
    });
    expect(result.current.status).toBe("idle");
  });
});
