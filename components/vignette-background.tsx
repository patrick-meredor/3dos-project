"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface VignetteBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  /**
   * Adjust the intensity of the perimeter vignette shadow
   * - "subtle": gentle framing, minimal edge contrast
   * - "default": balanced cinematic vignette
   * - "dramatic": pronounced spotlight effect
   */
  intensity?: "subtle" | "default" | "dramatic"
  /**
   * Whether to include the central ambient radiance layer
   */
  showAmbient?: boolean
  /**
   * Whether the background is fixed to the viewport or absolute within its parent
   */
  fixed?: boolean
}

export function VignetteBackground({
  children,
  className,
  intensity = "default",
  showAmbient = true,
  fixed = true,
  ...props
}: VignetteBackgroundProps) {
  const intensityMap = {
    subtle: "opacity-60",
    default: "opacity-100",
    dramatic: "opacity-135 contrast-125",
  }

  const backgroundElement = (
    <div
      aria-hidden="true"
      data-slot="vignette-background"
      className={cn(
        fixed ? "fixed inset-0" : "absolute inset-0",
        "pointer-events-none select-none overflow-hidden z-0",
        className
      )}
      {...props}
    >
      {/* Base ambient gradient: illuminates center and gently recedes toward perimeter */}
      {showAmbient && (
        <div
          data-slot="vignette-ambient"
          className="absolute inset-0 bg-radial-base transition-colors duration-500 ease-out"
        />
      )}

      {/* Cinematic vignette perimeter falloff: darkens the edges and corners */}
      <div
        data-slot="vignette-overlay"
        className={cn(
          "absolute inset-0 bg-radial-vignette transition-all duration-500 ease-out",
          intensityMap[intensity]
        )}
      />
    </div>
  )

  // If no children provided, render as standalone backdrop
  if (!children) {
    return backgroundElement
  }

  // If wrapping children, provide isolated stacking context
  return (
    <div className="relative min-h-screen w-full isolate">
      {backgroundElement}
      <div className="relative z-10 flex min-h-full flex-col">{children}</div>
    </div>
  )
}
