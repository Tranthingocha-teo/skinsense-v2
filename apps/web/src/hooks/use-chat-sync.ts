import { useEffect, useRef, type RefObject } from "react";

export const CHAT_SYNC_CHANNEL = "skinsense_realtime_chat";
export const CHAT_SYNC_STORAGE_KEY = "skinsense_realtime_chat_ping";

/**
 * Tell other tabs that a chat thread changed. Call only after the server has persisted
 * the change. Uses BroadcastChannel when available and falls back to a localStorage ping,
 * never both, so a listening tab refetches once.
 */
export function pingChatSync(): void {
  try {
    if (typeof window === "undefined") return;
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CHAT_SYNC_CHANNEL);
      bc.postMessage({ timestamp: Date.now() });
      bc.close();
      return;
    }
    window.localStorage.setItem(CHAT_SYNC_STORAGE_KEY, String(Date.now()));
  } catch {
    // Cross-tab sync is best-effort; polling still catches up.
  }
}

/**
 * Poll `fetcher` every `intervalMs` while `enabled`, plus once on enable (unless
 * `immediate` is false, for callers that already load on open), when the tab
 * becomes visible again, and on a cross-tab ping. At most one request is in flight; a
 * trigger that arrives meanwhile reruns once after it settles. Each request gets its own
 * AbortController; changing `enabled`/`key` or unmounting aborts it, and `onData` is never
 * called for an aborted (stale) request. Polling pauses while `document.hidden`.
 */
export function useChatSync<T>(options: {
  enabled: boolean;
  /** Restarts the sync (and aborts the in-flight request) when it changes, e.g. the shop id. */
  key?: string;
  intervalMs: number;
  immediate?: boolean;
  fetcher: (signal: AbortSignal) => Promise<T | null>;
  onData: (data: T) => void;
}): void {
  const { enabled, key, intervalMs, immediate = true } = options;
  const fetcherRef = useRef(options.fetcher);
  const onDataRef = useRef(options.onData);
  useEffect(() => {
    fetcherRef.current = options.fetcher;
    onDataRef.current = options.onData;
  });

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let controller: AbortController | null = null;
    let rerun = false;

    const run = async () => {
      if (disposed) return;
      if (typeof document !== "undefined" && document.hidden) return;
      if (controller) {
        rerun = true;
        return;
      }
      const current = new AbortController();
      controller = current;
      try {
        const data = await fetcherRef.current(current.signal);
        if (!current.signal.aborted && !disposed && data !== null) {
          onDataRef.current(data);
        }
      } catch {
        // Network errors and aborts: the next tick retries.
      } finally {
        if (controller === current) controller = null;
        if (rerun && !disposed) {
          rerun = false;
          void run();
        }
      }
    };

    if (immediate) void run();
    const timer = window.setInterval(() => void run(), intervalMs);

    const onVisibility = () => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let bc: BroadcastChannel | null = null;
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHAT_SYNC_STORAGE_KEY) void run();
    };
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel(CHAT_SYNC_CHANNEL);
      bc.onmessage = () => void run();
    } else {
      window.addEventListener("storage", onStorage);
    }

    return () => {
      disposed = true;
      controller?.abort();
      controller = null;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      bc?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, key, intervalMs, immediate]);
}

/**
 * Keep a scrollable message list pinned to the bottom: scroll only the container (never the
 * window), and only when the last message changed and the user was already near the bottom,
 * sent that message (`forceScroll`), or switched to another conversation (`scopeKey`).
 * Returns the onScroll handler to attach to the container.
 */
export function useStickToBottom(
  containerRef: RefObject<HTMLElement | null>,
  scopeKey: string,
  lastMessageId: string,
  forceScroll: boolean,
  thresholdPx = 80,
): () => void {
  const nearBottomRef = useRef(true);
  const prevRef = useRef({ scopeKey: "", lastMessageId: "" });

  useEffect(() => {
    const el = containerRef.current;
    const prev = prevRef.current;
    if (!el || (prev.scopeKey === scopeKey && prev.lastMessageId === lastMessageId)) return;
    const scopeChanged = prev.scopeKey !== scopeKey;
    prevRef.current = { scopeKey, lastMessageId };
    if (scopeChanged || forceScroll || nearBottomRef.current) {
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ top: el.scrollHeight, behavior: scopeChanged ? "auto" : "smooth" });
      } else {
        el.scrollTop = el.scrollHeight;
      }
      nearBottomRef.current = true;
    }
  }, [containerRef, scopeKey, lastMessageId, forceScroll]);

  return () => {
    const el = containerRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
  };
}
