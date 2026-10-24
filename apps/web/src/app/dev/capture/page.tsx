import { Suspense } from "react";
import { DevCapture } from "./dev-capture";

// /dev/capture?state=live|dark|review|saveError|saved|denied — the real camera and engine
// (Playwright's fake camera), Supabase swapped for stubs. Review and save states need the
// shutter and the save button clicked.
export default function DevCapturePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense>
        <DevCapture />
      </Suspense>
    </main>
  );
}
