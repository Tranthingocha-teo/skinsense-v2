"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Capture, type CaptureApi } from "@/components/capture";
import * as engine from "@/lib/capture-engine.web";

export function DevCapture() {
  const state = useSearchParams().get("state") ?? "live";
  const api = useMemo<CaptureApi>(
    () => ({
      startCamera: state === "denied" ? () => Promise.reject(new DOMException("denied", "NotAllowedError")) : engine.startCamera,
      loadEngine: engine.loadEngine,
      sampleFrame: (...args) => {
        const sample = engine.sampleFrame(...args);
        return state === "dark" ? { ...sample, issues: ["dark"] } : sample;
      },
      captureStill: async (...args) => ({ ...(await engine.captureStill(...args)), issues: state === "saved" ? [] : ["dark", "turned"] }),
      latestPhotoUrl: async () => null,
      savePhoto: async () => {
        if (state === "saveError") throw new Error("dev: save failed");
        return "dev-photo";
      },
    }),
    [state],
  );
  return <Capture api={api} />;
}
