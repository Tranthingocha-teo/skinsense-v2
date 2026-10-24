"use client";

import { ZONE_INDICES, ZONES } from "@skinsense/domain";
import { Canvas, invalidate, useFrame, useThree } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { type RefObject, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FACE_MESH } from "./face-mesh";
import { COUNT, ZONE_OFFSET, positionAt, presenceAt, progressFor } from "./face-scenes";

// Scratch objects for the frame loop: allocated once, never inside useFrame.
const DUMMY = new THREE.Object3D();
const TMP = [0, 0, 0];
const V = new THREE.Vector3();

// Where each zone's caption sits once the face has split: the zone centroid plus its drift.
const ZONE_CENTRE = ZONES.map((zone, k) => {
  const idx = ZONE_INDICES[zone];
  const c = [0, 0, 0];
  for (const i of idx) for (let a = 0; a < 3; a++) c[a] += FACE_MESH[i * 3 + a] / idx.length;
  return c.map((v, a) => v + ZONE_OFFSET[k][a]);
});

// One draw call: 468 instances, matrices mutated only when the progress changes.
function Particles({ progress, color, captions }: { progress: RefObject<number>; color: string; captions: RefObject<HTMLElement[]> }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const camera = useThree((s) => s.camera);
  const last = useRef(-1);

  useFrame(() => {
    const p = progress.current;
    if (p === last.current) return;
    last.current = p;
    for (let i = 0; i < COUNT; i++) {
      positionAt(i, p, TMP);
      DUMMY.position.set(TMP[0], TMP[1], TMP[2]);
      DUMMY.scale.setScalar(presenceAt(i, p));
      DUMMY.updateMatrix();
      mesh.current.setMatrixAt(i, DUMMY.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    // Captions fade in over the second half, pinned to each zone's projected centre.
    const split = Math.max(0, (p - 0.5) * 2);
    captions.current.forEach((el, k) => {
      V.set(ZONE_CENTRE[k][0], ZONE_CENTRE[k][1], ZONE_CENTRE[k][2]).project(camera);
      el.style.left = `${(V.x + 1) * 50}%`;
      el.style.top = `${(1 - V.y) * 50}%`;
      el.style.opacity = String(split);
    });
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.014, 6, 6]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
}

// Rendered on demand: frames only when the scroll position moves the box.
export function ParticleFace({ labels, onReady }: { labels: string[]; onReady: () => void }) {
  const box = useRef<HTMLDivElement>(null!);
  const progress = useRef(0);
  const captionRefs = useRef<HTMLElement[]>([]);
  // Loaded with ssr:false, so window exists at first render. Reduced motion: the split face, still.
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // three.js Color takes hex: the token roles are hex in packages/tokens/dist/web.css.
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState(() => getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim());
  // three.js cannot read CSS variables: re-read the particle colour when the theme flips.
  useEffect(() => {
    setColor(getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim());
  }, [resolvedTheme]);

  useEffect(() => {
    if (reduced) {
      progress.current = 1;
      return invalidate();
    }
    const update = () => {
      const r = box.current.getBoundingClientRect();
      progress.current = progressFor(r.top, r.height, window.innerHeight);
      invalidate();
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, [reduced]);

  return (
    <div ref={box} className="absolute inset-0 animate-in fade-in duration-700">
      <Canvas camera={{ position: [0, 0, 3.4], fov: 40 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} frameloop="demand" onCreated={onReady}>
        <Particles progress={progress} color={color} captions={captionRefs} />
      </Canvas>
      {labels.map((label, k) => (
        <span
          key={label}
          ref={(el) => {
            if (el) captionRefs.current[k] = el;
          }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-4xl border border-foreground/14 bg-card/72 px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] uppercase opacity-0 backdrop-blur-[18px]"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
