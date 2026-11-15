"use client";

import { initialsOf, ownImageUrl } from "@skinsense/domain";
import { cn } from "cn";
import { useState } from "react";
import { artworkTint } from "./artwork-tint";

interface InitialsAvatarProps {
  name: string;
  /** Stable id (user, shop, doctor) for the tint; defaults to the name. */
  seed?: string;
  /** The account's own uploaded picture, if any. Stock-photo URLs are ignored. */
  src?: string | null;
  className?: string;
  /** Accessible name; decorative when omitted (the name is usually printed next to it). */
  label?: string;
}

/** A person's or shop's own picture, else their initials on a tint derived from their id. */
export function InitialsAvatar({ name, seed, src, className, label }: InitialsAvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const url = ownImageUrl(src);
  const base = cn("size-10 shrink-0 rounded-full", className);

  if (url && failed !== url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={label ?? ""} className={cn(base, "object-cover")} onError={() => setFailed(url)} loading="lazy" />
    );
  }
  const tint = artworkTint(seed ?? name);
  return (
    <span
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      data-slot="initials-avatar"
      className={cn("size-10 shrink-0 rounded-full inline-flex select-none items-center justify-center text-sm font-medium tracking-wide text-foreground", className)}
      style={{ background: tint.bg }}
    >
      {initialsOf(name)}
    </span>
  );
}
