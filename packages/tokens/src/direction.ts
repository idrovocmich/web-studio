import type { Dimension, Token, TokenGroup } from "./types.js";

/** How much air surrounds content: section rhythm, gaps, container width. */
export type Density = "airy" | "balanced" | "dense";
/** How far apart the extremes are: type scale, lines, surfaces, elevation. */
export type Contrast = "soft" | "balanced" | "stark";
/** Shape language for controls, surfaces and media. */
export type ShapeLanguage = "straight" | "rounded" | "organic";
/** Typographic voice: leading, tracking, measure and heading weight. */
export type TypePersonality = "editorial" | "technical" | "warm" | "expressive";
/** Amount of motion: reveal distance, stagger and duration. */
export type MotionIntensity = "none" | "subtle" | "moderate" | "expressive";
export type Elevation = "flat" | "soft" | "dramatic";

/** Art direction controls. They change token values; composition is decided by the sections. */
export interface DirectionOptions {
  density?: Density;
  contrast?: Contrast;
  shape?: ShapeLanguage;
  typePersonality?: TypePersonality;
  motion?: MotionIntensity;
  /** Defaults to the contrast: stark brands use lines, not shadows. */
  elevation?: Elevation;
}

export type ResolvedDirection = Required<DirectionOptions>;

export const DEFAULT_DIRECTION = {
  density: "balanced",
  contrast: "balanced",
  shape: "rounded",
  typePersonality: "editorial",
  motion: "subtle",
} as const satisfies Required<Omit<DirectionOptions, "elevation">>;

const ELEVATION_BY_CONTRAST: Record<Contrast, Elevation> = {
  soft: "soft",
  balanced: "soft",
  stark: "flat",
};

export function resolveDirectionOptions(options: DirectionOptions = {}): ResolvedDirection {
  const merged = { ...DEFAULT_DIRECTION, ...options };
  return { ...merged, elevation: options.elevation ?? ELEVATION_BY_CONTRAST[merged.contrast] };
}

const round = (n: number): number => Number(n.toFixed(4));
const rem = (value: number): Dimension => ({ value: round(value), unit: "rem" });
const px = (value: number): Dimension => ({ value, unit: "px" });
const dimension = (value: Dimension): Token => ({ $type: "dimension", $value: value });
const number = (value: number): Token => ({ $type: "number", $value: value });

/** Steps of the base space scale (in rem) that follow density; smaller steps stay fixed. */
const SPACE_REM = { 6: 1.5, 8: 2, 10: 2.5, 12: 3, 16: 4, 20: 5, 24: 6, 32: 8 };
const DENSITY_FACTOR: Record<Density, number> = { airy: 1.3, balanced: 1, dense: 0.75 };

const GRID: Record<
  Density,
  { gutter: [number, number]; margin: [number, number]; maxWidth: number }
> = {
  airy: { gutter: [1.25, 2.5], margin: [1.5, 4], maxWidth: 76 },
  balanced: { gutter: [1, 1.5], margin: [1, 2.5], maxWidth: 80 },
  dense: { gutter: [0.75, 1.25], margin: [1, 2], maxWidth: 88 },
};

/** Default modular ratios when the brand does not set its own type scale. */
export const RATIO_BY_CONTRAST: Record<Contrast, { ratioMin: number; ratioMax: number }> = {
  soft: { ratioMin: 1.15, ratioMax: 1.2 },
  balanced: { ratioMin: 1.2, ratioMax: 1.25 },
  stark: { ratioMin: 1.25, ratioMax: 1.414 },
};

const PERSONALITY: Record<
  TypePersonality,
  {
    leading: [tight: number, snug: number, normal: number, relaxed: number];
    tracking: { tight: number; wider: number };
    prose: number;
    headingWeight: number;
  }
> = {
  editorial: {
    leading: [1.05, 1.15, 1.6, 1.75],
    tracking: { tight: -0.025, wider: 0.12 },
    prose: 36,
    headingWeight: 400,
  },
  technical: {
    leading: [1.1, 1.2, 1.5, 1.65],
    tracking: { tight: -0.01, wider: 0.08 },
    prose: 46,
    headingWeight: 600,
  },
  warm: {
    leading: [1.15, 1.3, 1.65, 1.8],
    tracking: { tight: -0.005, wider: 0.06 },
    prose: 40,
    headingWeight: 600,
  },
  expressive: {
    leading: [0.92, 1.05, 1.55, 1.7],
    tracking: { tight: -0.045, wider: 0.14 },
    prose: 34,
    headingWeight: 700,
  },
};

export const RADIUS_BY_SHAPE: Record<ShapeLanguage, Record<string, number>> = {
  straight: { none: 0, xs: 0, sm: 0.0625, md: 0.125, lg: 0.125, xl: 0.25 },
  rounded: { none: 0, xs: 0.125, sm: 0.25, md: 0.5, lg: 0.75, xl: 1 },
  organic: { none: 0, xs: 0.375, sm: 0.75, md: 1.25, lg: 2, xl: 3 },
};

export const MOTION: Record<
  MotionIntensity,
  { durationFactor: number; distance: number; stagger: number; scale: number }
> = {
  none: { durationFactor: 0.6, distance: 0, stagger: 0, scale: 1 },
  subtle: { durationFactor: 1, distance: 0.5, stagger: 40, scale: 1 },
  moderate: { durationFactor: 1.2, distance: 1.5, stagger: 70, scale: 0.98 },
  expressive: { durationFactor: 1.4, distance: 3, stagger: 110, scale: 0.94 },
};

/** Picks the available weight closest to the personality's target heading weight. */
export function headingWeight(personality: TypePersonality, available?: readonly number[]): number {
  const target = PERSONALITY[personality].headingWeight;
  if (!available || available.length === 0) return target;
  return available.reduce((best, w) =>
    Math.abs(w - target) < Math.abs(best - target) ||
    (Math.abs(w - target) === Math.abs(best - target) && w > best)
      ? w
      : best,
  );
}

/** Primitive tokens that depend on the art direction (merged over the static primitives). */
export function directionPrimitives(
  direction: ResolvedDirection,
  displayWeights?: readonly number[],
): TokenGroup {
  const factor = DENSITY_FACTOR[direction.density];
  const space: TokenGroup = {};
  for (const [step, value] of Object.entries(SPACE_REM))
    space[step] = dimension(rem(value * factor));

  const grid = GRID[direction.density];
  const type = PERSONALITY[direction.typePersonality];
  const [tight, snug, normal, relaxed] = type.leading;
  const motion = MOTION[direction.motion];

  return {
    space,
    border: {
      width: { thin: dimension(px(direction.contrast === "stark" ? 1.5 : 1)) },
    },
    font: {
      weight: {
        display: {
          $type: "fontWeight",
          $value: headingWeight(direction.typePersonality, displayWeights),
        },
      },
      leading: {
        tight: number(tight),
        snug: number(snug),
        normal: number(normal),
        relaxed: number(relaxed),
      },
      tracking: {
        tight: dimension({ value: type.tracking.tight, unit: "em" }),
        wider: dimension({ value: type.tracking.wider, unit: "em" }),
      },
    },
    grid: {
      gutter: { compact: dimension(rem(grid.gutter[0])), wide: dimension(rem(grid.gutter[1])) },
      margin: { compact: dimension(rem(grid.margin[0])), wide: dimension(rem(grid.margin[1])) },
      "max-width": dimension(rem(grid.maxWidth)),
      "prose-width": dimension(rem(type.prose)),
    },
    motion: {
      distance: dimension(rem(motion.distance)),
      stagger: { $type: "duration", $value: { value: motion.stagger, unit: "ms" } },
      scale: number(motion.scale),
    },
  };
}

/** Neutral steps for lines per contrast level: [light, dark]. */
export const LINES_BY_CONTRAST: Record<
  Contrast,
  { subtle: [number, number]; strong: [number, number] }
> = {
  soft: { subtle: [100, 900], strong: [500, 500] },
  balanced: { subtle: [200, 800], strong: [500, 500] },
  stark: { subtle: [300, 700], strong: [800, 200] },
};
