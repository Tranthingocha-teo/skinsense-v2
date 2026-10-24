"use client";

import { useRef } from "react";
import { useNear } from "@/lib/use-near";

// The real Hôm nay (ticket 04) on demo data, in its own 390px document: the phone layout at any viewport.
// That document is a second React app, so it loads only when the phone nears the viewport: in the
// motion layout the phone starts clipped below the stage and the first scroll brings it in.
// Without scripts, the noscript copy shows it.
const FRAME = "pointer-events-none absolute top-0 left-0 h-[812px] w-[390px] origin-top-left scale-[0.641] border-0 md:scale-[0.872]";

export function StageScreen() {
  const box = useRef<HTMLDivElement>(null);
  const near = useNear(box, "50% 0px");
  return (
    <div ref={box} className="absolute inset-0">
      {near ? (
        <iframe src="/stage" title="Hôm nay" tabIndex={-1} className={FRAME} />
      ) : (
        <noscript>
          <iframe src="/stage" title="Hôm nay" tabIndex={-1} className={FRAME} />
        </noscript>
      )}
    </div>
  );
}
