import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatSync } from "./use-chat-sync";

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("useChatSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("does not start a new poll while one is in flight", async () => {
    const pending = deferred<string>();
    const fetcher = vi.fn(() => pending.promise);
    const onData = vi.fn();
    renderHook(() => useChatSync({ enabled: true, intervalMs: 1000, fetcher, onData }));

    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve("a");
      await pending.promise;
    });
    expect(onData).toHaveBeenCalledWith("a");
  });

  it("aborts the in-flight request and ignores its response when the key changes", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const signals: AbortSignal[] = [];
    const fetcher = vi
      .fn<(s: AbortSignal) => Promise<string>>()
      .mockImplementationOnce((s) => {
        signals.push(s);
        return first.promise;
      })
      .mockImplementationOnce((s) => {
        signals.push(s);
        return second.promise;
      });
    const onData = vi.fn();
    const { rerender } = renderHook(
      ({ shop }) => useChatSync({ enabled: true, key: shop, intervalMs: 1000, fetcher, onData }),
      { initialProps: { shop: "a" } },
    );

    rerender({ shop: "b" });
    expect(signals[0].aborted).toBe(true);

    await act(async () => {
      second.resolve("thread-b");
      first.resolve("thread-a");
      await Promise.all([first.promise, second.promise]);
    });
    expect(onData).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith("thread-b");
  });

  it("pauses polling while the document is hidden", async () => {
    const fetcher = vi.fn(async () => "x");
    renderHook(() => useChatSync({ enabled: true, intervalMs: 1000, fetcher, onData: () => {} }));
    await act(async () => {});
    expect(fetcher).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does nothing while disabled", () => {
    const fetcher = vi.fn(async () => "x");
    renderHook(() => useChatSync({ enabled: false, intervalMs: 1000, fetcher, onData: () => {} }));
    vi.advanceTimersByTime(5000);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
