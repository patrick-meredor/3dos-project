"use client";

import * as React from "react";
import { GridBackground, type GridBackgroundProps } from "./grid-background";

export type VignetteBackgroundProps = GridBackgroundProps;

/**
 * @deprecated Use `GridBackground` from `@/components/grid-background` instead.
 * Replaced the radial vignette background with the line grid background.
 */
export function VignetteBackground(props: VignetteBackgroundProps) {
  return <GridBackground {...props} />;
}

export { GridBackground };
