"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useRef, useState } from "react";
import { useNear } from "@/lib/use-near";

// Client-only: three.js never renders on the server and its chunk is fetched only
// when the section nears the viewport. The static placeholder (children) stays
// until the canvas has drawn, so nothing goes blank while the chunk loads.
const ParticleFace = dynamic(() => import("./particle-face").then((m) => m.ParticleFace), { ssr: false });

export function ParticleFaceSlot({ labels, children }: { labels: string[]; children: ReactNode }) {
  const slot = useRef<HTMLDivElement>(null);
  const near = useNear(slot, "400px 0px");
  const [ready, setReady] = useState(false);

  return (
    <div ref={slot} className="absolute inset-0">
      <div hidden={ready} className="absolute inset-0">
        {children}
      </div>
      {near && <ParticleFace labels={labels} onReady={() => setReady(true)} />}
    </div>
  );
}
