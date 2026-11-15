"use client";

import { ownImageUrl } from "@skinsense/domain";
import { cn } from "cn";
import { Camera } from "lucide-react";
import { useState } from "react";
import { InitialsAvatar } from "./initials-avatar";

/**
 * The skin photo a patient sent with their case, or, when they sent none, their initials (small)
 * or a plain "no photo yet" panel (large). Never a stand-in face from the internet.
 */
export function PatientPhoto({
  src,
  name,
  seed,
  className,
  large = false,
  emptyLabel = "Bệnh nhân chưa gửi ảnh da",
}: {
  src?: string | null;
  name: string;
  seed?: string;
  className?: string;
  large?: boolean;
  emptyLabel?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const url = ownImageUrl(src);
  if (url && failed !== url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={`Ảnh da của ${name}`} className={cn("object-cover", className)} onError={() => setFailed(url)} />
    );
  }
  if (!large) return <InitialsAvatar name={name} seed={seed} className={cn("rounded-none text-xl", className)} />;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground", className)}>
      <Camera className="size-6" strokeWidth={1.5} aria-hidden />
      <span className="text-xs">{emptyLabel}</span>
    </div>
  );
}
