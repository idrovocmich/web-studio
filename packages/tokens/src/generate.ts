import { generateRamp, oklch, RAMP_STEPS, type OklchInput } from "./color.js";
import { mergeGroups } from "./tree.js";
import type { Dimension, ShadowValue, Token, TokenGroup, TokenTree } from "./types.js";
import componentTokens from "./tokens/component.tokens.json" with { type: "json" };
import primitiveTokens from "./tokens/primitive.tokens.json" with { type: "json" };
import semanticTokens from "./tokens/semantic.tokens.json" with { type: "json" };

export type Shape = "sharp" | "soft" | "round";
export type MotionPersonality = "calm" | "balanced" | "snappy";
export type Elevation = "flat" | "soft" | "dramatic";

export interface PaletteOptions {
  /** Neutral ramp: only chroma and hue are used, lightness is fixed per step. */
  neutral?: { c: number; h: number };
  primary?: OklchInput;
  accent?: OklchInput;
  success?: OklchInput;
  warning?: OklchInput;
  danger?: OklchInput;
}

export interface TypeScaleOptions {
  /** Base font size in rem at the smallest viewport. */
  baseMin?: number;
  /** Base font size in rem at the largest viewport. */
  baseMax?: number;
  /** Modular ratio at the smallest viewport. */
  ratioMin?: number;
  /** Modular ratio at the largest viewport. */
  ratioMax?: number;
  /** Viewport range in rem over which sizes scale. */
  viewport?: { min: number; max: number };
}

export interface EngineOptions {
  palette?: PaletteOptions;
  fonts?: { display?: string[]; body?: string[]; mono?: string[] };
  typeScale?: TypeScaleOptions;
  shape?: Shape;
  motion?: MotionPersonality;
  elevation?: Elevation;
}

export const DEFAULT_PALETTE = {
  neutral: { c: 0.012, h: 255 },
  primary: { l: 0.53, c: 0.16, h: 255 },
  accent: { l: 0.7, c: 0.15, h: 45 },
  success: { l: 0.53, c: 0.13, h: 150 },
  warning: { l: 0.62, c: 0.15, h: 65 },
  danger: { l: 0.53, c: 0.19, h: 27 },
} as const satisfies Required<PaletteOptions>;

const SYSTEM_FONTS = {
  display: ["ui-sans-serif", "system-ui", "sans-serif"],
  body: ["ui-sans-serif", "system-ui", "sans-serif"],
  mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
};

const TYPE_STEPS = {
  xs: -2,
  sm: -1,
  base: 0,
  lg: 1,
  xl: 2,
  "2xl": 3,
  "3xl": 4,
  "4xl": 5,
  "5xl": 6,
};

const RADIUS: Record<Shape, Record<string, number>> = {
  sharp: { none: 0, xs: 0, sm: 0.125, md: 0.125, lg: 0.25, xl: 0.25 },
  soft: { none: 0, xs: 0.125, sm: 0.25, md: 0.5, lg: 0.75, xl: 1 },
  round: { none: 0, xs: 0.25, sm: 0.5, md: 0.875, lg: 1.25, xl: 2 },
};

const DURATION_MS = { instant: 0, fast: 120, base: 200, slow: 320, slower: 500 };
const MOTION_FACTOR: Record<MotionPersonality, number> = { calm: 1.5, balanced: 1, snappy: 0.7 };

/** [offsetY px, blur px, spread px, alpha] per shadow size. */
const SHADOWS: Record<Elevation, Record<"sm" | "md" | "lg", [number, number, number, number]>> = {
  flat: { sm: [1, 0, 0, 0.06], md: [1, 2, 0, 0.08], lg: [2, 4, 0, 0.1] },
  soft: { sm: [1, 2, 0, 0.08], md: [4, 12, -2, 0.12], lg: [12, 32, -8, 0.16] },
  dramatic: { sm: [2, 4, 0, 0.14], md: [10, 24, -4, 0.22], lg: [24, 56, -12, 0.32] },
};

const round = (n: number): number => Number(n.toFixed(4));
const rem = (value: number): Dimension => ({ value: round(value), unit: "rem" });
const px = (value: number): Dimension => ({ value, unit: "px" });

function rampGroup(input: OklchInput, anchor: boolean): TokenGroup {
  const ramp = generateRamp(input, { anchor });
  const group: TokenGroup = {};
  for (const step of RAMP_STEPS) {
    const token: Token = { $type: "color", $value: ramp.steps[step] };
    if (ramp.anchor === step) token.$description = "Exact brand color (ramp anchor).";
    group[String(step)] = token;
  }
  return group;
}

function generatedPrimitives(options: EngineOptions): TokenGroup {
  const palette = { ...DEFAULT_PALETTE, ...options.palette };
  const neutral = palette.neutral;
  const fonts = { ...SYSTEM_FONTS, ...options.fonts };
  const scale = {
    baseMin: 1,
    baseMax: 1.125,
    ratioMin: 1.2,
    ratioMax: 1.25,
    viewport: { min: 20, max: 80 },
    ...options.typeScale,
  };
  const shape = options.shape ?? "soft";
  const factor = MOTION_FACTOR[options.motion ?? "balanced"];
  const elevation = SHADOWS[options.elevation ?? "soft"];

  const fontSize: TokenGroup = {};
  for (const [name, step] of Object.entries(TYPE_STEPS)) {
    fontSize[name] = {
      $type: "dimension",
      $value: rem(scale.baseMin * scale.ratioMin ** step),
      $extensions: {
        "com.idrovocmich.ws": {
          fluid: { max: rem(scale.baseMax * scale.ratioMax ** step), viewport: scale.viewport },
        },
      },
    };
  }

  const radius: TokenGroup = {};
  for (const [name, value] of Object.entries(RADIUS[shape])) {
    radius[name] = { $type: "dimension", $value: rem(value) };
  }
  radius["full"] = { $type: "dimension", $value: px(9999) };

  const duration: TokenGroup = {};
  for (const [name, ms] of Object.entries(DURATION_MS)) {
    duration[name] = { $type: "duration", $value: { value: Math.round(ms * factor), unit: "ms" } };
  }

  const shadow: TokenGroup = {};
  for (const [name, [y, blur, spread, alpha]] of Object.entries(elevation)) {
    const value: ShadowValue = {
      color: oklch(0.2, Math.min(neutral.c * 2, 0.04), neutral.h, alpha),
      offsetX: px(0),
      offsetY: px(y),
      blur: px(blur),
      spread: px(spread),
    };
    shadow[name] = { $type: "shadow", $value: value };
  }

  return {
    color: {
      neutral: rampGroup({ l: 0.62, ...neutral }, false),
      primary: rampGroup(palette.primary, true),
      accent: rampGroup(palette.accent, true),
      success: rampGroup(palette.success, true),
      warning: rampGroup(palette.warning, true),
      danger: rampGroup(palette.danger, true),
    },
    font: {
      family: {
        display: { $type: "fontFamily", $value: fonts.display },
        body: { $type: "fontFamily", $value: fonts.body },
        mono: { $type: "fontFamily", $value: fonts.mono },
      },
      size: fontSize,
    },
    radius,
    duration,
    shadow,
  };
}

// JSON imports are typed loosely by TypeScript; their structure is checked by validateTiers().
const asGroup = (json: unknown): TokenGroup => structuredClone(json) as TokenGroup;

/** Builds the full three-tier token tree; with no options it is the neutral engine default. */
export function createTokens(options: EngineOptions = {}): TokenTree {
  return {
    primitive: mergeGroups(asGroup(primitiveTokens), generatedPrimitives(options)),
    semantic: asGroup(semanticTokens),
    component: asGroup(componentTokens),
  };
}
