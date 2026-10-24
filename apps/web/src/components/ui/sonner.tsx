"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Canvas WebFeedbackSent toast: surface-2, 1px fg at 14%, control radius, 14px text, check in success.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-success">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--surface-2)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "color-mix(in oklab, var(--foreground) 14%, transparent)",
          "--border-radius": "var(--radius-control)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast gap-2.5! px-[18px]! py-3.5! font-sans! text-sm! font-normal! shadow-[0_16px_40px_rgba(0,0,0,0.28)]!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
