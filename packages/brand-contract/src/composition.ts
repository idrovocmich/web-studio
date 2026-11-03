import type { Direction } from "./schema.js";

/**
 * Structural decisions derived from a brand's art direction. Sections read these to change their
 * composition (grid, scale, alignment, separators), not just their colors, so two brands with the
 * same content end up with different layouts.
 */
export interface Composition {
  /** Vertical rhythm between and inside sections. */
  rhythm: "spacious" | "regular" | "tight";
  /** Column split for two-part layouts on a 12-column grid, as [main, aside]. */
  split: readonly [number, number];
  /** How far layouts lean away from symmetry. */
  asymmetry: "none" | "mild" | "strong";
  /** Whether a section may push headings or media past the grid edge. */
  breakout: boolean;
  /** Size of the page's largest heading relative to the type scale. */
  headingScale: "modest" | "large" | "monumental";
  /** Default alignment for headings; never centered by default. */
  headingAlign: "start" | "offset";
  /** How sections are separated from each other. */
  separator: "space" | "rule" | "heavy-rule" | "curve";
  /** How surfaces (cards, panels) are distinguished from the page. */
  surface: "tinted" | "outlined" | "raised";
  /** Crop applied to images and media frames. */
  media: "rect" | "rounded" | "organic";
  /** Style of small labels above headings. */
  eyebrow: "mono-caps" | "italic" | "caps" | "sentence";
  /** Numeral style for figures and data. */
  numerals: "tabular-nums" | "oldstyle-nums" | "proportional-nums" | "lining-nums";
  /** Entrance choreography; always disabled under prefers-reduced-motion. */
  reveal: "none" | "fade" | "rise" | "choreographed";
  /** The brand's one memorable decision; sections concentrate their boldness here. */
  signature: string;
}

const RHYTHM = { airy: "spacious", balanced: "regular", dense: "tight" } as const;
const MEDIA = { straight: "rect", rounded: "rounded", organic: "organic" } as const;
const REVEAL = {
  none: "none",
  subtle: "fade",
  moderate: "rise",
  expressive: "choreographed",
} as const;
const EYEBROW = {
  editorial: "italic",
  technical: "mono-caps",
  warm: "sentence",
  expressive: "caps",
} as const;
const NUMERALS = {
  editorial: "oldstyle-nums",
  technical: "tabular-nums",
  warm: "proportional-nums",
  expressive: "lining-nums",
} as const;

export function resolveComposition(direction: Direction): Composition {
  const { density, contrast, shape, typePersonality } = direction;
  const expressive = typePersonality === "expressive";

  const asymmetry =
    typePersonality === "editorial" || expressive
      ? "strong"
      : contrast === "soft" && typePersonality === "warm"
        ? "none"
        : "mild";
  const split = { none: [6, 6], mild: [7, 5], strong: [8, 4] } as const;

  return {
    rhythm: RHYTHM[density],
    split: split[asymmetry],
    asymmetry,
    breakout: expressive || contrast === "stark",
    headingScale:
      contrast === "stark" || expressive ? "monumental" : contrast === "soft" ? "modest" : "large",
    headingAlign: asymmetry === "strong" ? "offset" : "start",
    separator:
      shape === "organic"
        ? "curve"
        : contrast === "stark"
          ? "heavy-rule"
          : contrast === "soft"
            ? "space"
            : "rule",
    surface: contrast === "stark" ? "outlined" : contrast === "soft" ? "tinted" : "raised",
    media: MEDIA[shape],
    eyebrow: EYEBROW[typePersonality],
    numerals: NUMERALS[typePersonality],
    reveal: REVEAL[direction.motion],
    signature: direction.signature,
  };
}

/** `data-ws-*` attributes for `<html>`, so CSS can change structure per direction. */
export function directionAttributes(direction: Direction): Record<string, string> {
  return {
    "data-ws-density": direction.density,
    "data-ws-contrast": direction.contrast,
    "data-ws-shape": direction.shape,
    "data-ws-type": direction.typePersonality,
    "data-ws-motion": direction.motion,
  };
}

/**
 * `data-ws-*` attributes for every structural decision, so component CSS can follow the
 * composition without duplicating `resolveComposition()`.
 */
export function compositionAttributes(composition: Composition): Record<string, string> {
  return {
    "data-ws-rhythm": composition.rhythm,
    "data-ws-split": composition.split.join("-"),
    "data-ws-asymmetry": composition.asymmetry,
    "data-ws-breakout": String(composition.breakout),
    "data-ws-heading-scale": composition.headingScale,
    "data-ws-heading-align": composition.headingAlign,
    "data-ws-separator": composition.separator,
    "data-ws-surface": composition.surface,
    "data-ws-media": composition.media,
    "data-ws-eyebrow": composition.eyebrow,
    "data-ws-numerals": composition.numerals,
    "data-ws-reveal": composition.reveal,
  };
}
