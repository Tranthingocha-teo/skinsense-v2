"use client";

import dynamic from "next/dynamic";

// GSAP, ScrollTrigger and Lenis arrive in their own chunk after hydration; the page never waits on them.
export const StageMotion = dynamic(() => import("./stage-motion"), { ssr: false });
