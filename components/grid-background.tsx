"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GridBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /**
   * Spacing of the grid lines in pixels.
   * @default 48
   */
  gridSize?: number;
  /**
   * Visual intensity of the grid lines:
   * - "subtle": gentle lines with soft contrast
   * - "default": crisp, balanced lines matching the Molecule UI grid preview
   * - "bold": prominent line contrast
   * @default "default"
   */
  intensity?: "subtle" | "default" | "bold";
  /**
   * Optional radial edge fade. When false (default), the grid cleanly covers the entire viewport.
   * @default false
   */
  radialFade?: boolean;
  /**
   * Whether the grid is fixed to the viewport or absolute within its parent container
   * @default true
   */
  fixed?: boolean;
}

export function GridBackground({
  children,
  className,
  gridSize = 48,
  intensity = "default",
  radialFade = false,
  fixed = true,
  ...props
}: GridBackgroundProps) {
  const intensityStyles = {
    subtle: "opacity-60",
    default: "opacity-100",
    bold: "opacity-140 contrast-125",
  };

  const backgroundElement = (
    <div
      aria-hidden="true"
      data-slot="grid-background"
      className={cn(
        fixed ? "fixed inset-0" : "absolute inset-0",
        "pointer-events-none select-none overflow-hidden z-0",
        className
      )}
      {...props}
    >
      {/* Crisp line grid background matching the Molecule UI reference */}
      <div
        data-slot="grid-lines"
        className={cn(
          "absolute inset-0",
          intensityStyles[intensity]
        )}
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-line, rgba(255, 255, 255, 0.12)) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line, rgba(255, 255, 255, 0.12)) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />

      {/* Optional gentle edge fade */}
      {radialFade && (
        <div
          data-slot="grid-radial-fade"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--background)_100%)] pointer-events-none"
        />
      )}
    </div>
  );

  if (!children) {
    return backgroundElement;
  }

  return (
    <div className="relative min-h-screen w-full isolate">
      {backgroundElement}
      <div className="relative z-10 flex min-h-full flex-col">{children}</div>
    </div>
  );
}
