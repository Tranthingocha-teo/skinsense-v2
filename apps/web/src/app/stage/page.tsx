import type { Metadata } from "next";
import { DemoToday } from "../demo/demo-bindings";

// The screen inside the landing's scroll-stage phone: the real Hôm nay on demo
// data, in its own 390px document so the phone layout applies at any viewport.
export const metadata: Metadata = { robots: { index: false } };

export default function StagePage() {
  return (
    <main className="flex flex-1 flex-col">
      <DemoToday />
    </main>
  );
}
