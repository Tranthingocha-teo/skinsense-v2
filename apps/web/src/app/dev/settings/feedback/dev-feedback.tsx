"use client";

import { Feedback } from "@/components/feedback";

export function DevFeedback({ fail }: { fail: boolean }) {
  return (
    <Feedback
      api={{
        sendFeedback: () => (fail ? Promise.reject(new Error("dev")) : Promise.resolve()),
        deviceInfo: () => ({ appVersion: "dev", deviceNote: navigator.userAgent }),
      }}
    />
  );
}
