"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { SCENES, sceneAt } from "./stage-scenes";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// DESIGN.md Motion, web landing: three scrubbed scenes over the CSS-sticky stage (no pin).
// Scene 1: steps fade up (0.35), phone rises from 115% (power2.out, 1 scene), four cards enter
// (0.5, stagger 0.12, power3.out). Scene 2: numbers count up (0.7, power1.out), cards drift up
// 45% × depth, phone settles to scale 0.94. Scene 3: the sparkline draws (0.8).
// Without this chunk, or under reduced motion, the stage is the static scene-2 layout.
export default function StageMotion() {
  useGSAP(() => {
    const track = document.querySelector<HTMLElement>(".stage-track");
    if (!track) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ autoRaf: false });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      const q = <T extends Element = HTMLElement>(s: string) => Array.from(track.querySelectorAll<T>(s));
      const steps = q(".stage-steps li");
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            const scene = sceneAt(self.progress);
            steps.forEach((li, i) => (li.dataset.active = String(i === scene)));
          },
        },
      });

      tl.fromTo(q(".stage-steps"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0)
        // y: 0 drops the px offset GSAP parses from the CSS first-paint translateY(115%).
        .fromTo(q(".stage-phone-wrap"), { y: 0, yPercent: 115 }, { y: 0, yPercent: 0, duration: 1, ease: "power2.out" }, 0)
        .fromTo(q(".stage-card"), { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power3.out" }, 0.5);
      for (const el of q("[data-count]")) {
        const end = Number(el.dataset.count);
        const digits = Number(el.dataset.digits ?? 0);
        const n = { v: 0 };
        tl.fromTo(n, { v: 0 }, { v: end, duration: 0.7, ease: "power1.out", onUpdate: () => void (el.textContent = n.v.toFixed(digits)) }, 1);
      }
      tl.to(q(".stage-card"), { yPercent: (_i: number, el: HTMLElement) => -Number(el.dataset.depth) * 45, duration: SCENES - 1 }, 1)
        .to(q(".stage-phone"), { scale: 0.94, duration: 1 }, 1)
        .fromTo(q(".stage-spark"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8 }, 2);

      return () => {
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    });
    return () => mm.revert();
  });
  return null;
}
