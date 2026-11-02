import { clampChroma, wcagContrast, type Oklch } from "culori";
import type { OklchColor } from "./types.js";

export interface OklchInput {
  /** Lightness, 0–1. */
  l: number;
  /** Chroma, roughly 0–0.4. */
  c: number;
  /** Hue angle, 0–360. */
  h: number;
}

const round = (n: number, digits = 4): number => Number(n.toFixed(digits));

export function oklch(l: number, c: number, h: number, alpha?: number): OklchColor {
  const color: OklchColor = { colorSpace: "oklch", components: [round(l), round(c), round(h, 2)] };
  if (alpha !== undefined && alpha < 1) color.alpha = round(alpha, 3);
  return color;
}

export function colorToCss(color: OklchColor): string {
  const [l, c, h] = color.components;
  const alpha = color.alpha !== undefined && color.alpha < 1 ? ` / ${color.alpha}` : "";
  return `oklch(${l} ${c} ${h}${alpha})`;
}

function toCulori(color: OklchColor): Oklch {
  const [l, c, h] = color.components;
  return { mode: "oklch", l, c, h };
}

/** WCAG 2.x contrast ratio between two opaque colors. */
export function contrastRatio(a: OklchColor, b: OklchColor): number {
  return wcagContrast(toCulori(a), toCulori(b));
}

/** Reduces chroma until the color fits in sRGB, keeping lightness and hue. */
function fitToSrgb(l: number, c: number, h: number): OklchColor {
  const fitted = clampChroma({ mode: "oklch", l, c, h }, "oklch", "rgb");
  return oklch(fitted.l, fitted.c ?? 0, h);
}

export const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type RampStep = (typeof RAMP_STEPS)[number];

/** Fixed lightness per step keeps contrast predictable across every brand. */
const RAMP_LIGHTNESS: Record<RampStep, number> = {
  50: 0.975,
  100: 0.94,
  200: 0.88,
  300: 0.8,
  400: 0.71,
  500: 0.62,
  600: 0.53,
  700: 0.45,
  800: 0.37,
  900: 0.29,
  950: 0.21,
};

/** Chroma peaks in the mid steps and fades toward white and black. */
const RAMP_CHROMA: Record<RampStep, number> = {
  50: 0.12,
  100: 0.25,
  200: 0.5,
  300: 0.75,
  400: 0.92,
  500: 1,
  600: 1,
  700: 0.92,
  800: 0.78,
  900: 0.62,
  950: 0.48,
};

export interface Ramp {
  steps: Record<RampStep, OklchColor>;
  /** Step replaced by the exact input color, when anchored. */
  anchor?: RampStep;
}

/**
 * Builds an 11-step ramp from one color. With `anchor`, the step whose lightness is
 * closest to the input is replaced by the exact input color so brand colors stay exact.
 */
export function generateRamp(base: OklchInput, { anchor = true } = {}): Ramp {
  const steps = {} as Record<RampStep, OklchColor>;
  for (const step of RAMP_STEPS) {
    steps[step] = fitToSrgb(RAMP_LIGHTNESS[step], base.c * RAMP_CHROMA[step], base.h);
  }
  if (!anchor) return { steps };
  const nearest = RAMP_STEPS.reduce((best, step) =>
    Math.abs(RAMP_LIGHTNESS[step] - base.l) < Math.abs(RAMP_LIGHTNESS[best] - base.l) ? step : best,
  );
  steps[nearest] = fitToSrgb(base.l, base.c, base.h);
  return { steps, anchor: nearest };
}
