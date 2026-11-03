import {
  contrastRatio,
  generateRamp,
  oklch,
  RAMP_STEPS,
  type OklchInput,
  type RampStep,
} from "./color.js";
import {
  directionPrimitives,
  LINES_BY_CONTRAST,
  MOTION,
  RADIUS_BY_SHAPE,
  RATIO_BY_CONTRAST,
  resolveDirectionOptions,
  type DirectionOptions,
  type Elevation,
  type ResolvedDirection,
} from "./direction.js";
import { mergeGroups } from "./tree.js";
import type { Dimension, OklchColor, ShadowValue, Token, TokenGroup, TokenTree } from "./types.js";
import componentTokens from "./tokens/component.tokens.json" with { type: "json" };
import primitiveTokens from "./tokens/primitive.tokens.json" with { type: "json" };
import semanticTokens from "./tokens/semantic.tokens.json" with { type: "json" };

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
  /** Art direction: density, contrast, shape language, type personality and motion intensity. */
  direction?: DirectionOptions;
  /** Weights the brand actually ships for its display font; the heading weight snaps to them. */
  displayWeights?: number[];
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

const DURATION_MS = { instant: 0, fast: 120, base: 200, slow: 320, slower: 500 };

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

function generatedPrimitives(options: EngineOptions, direction: ResolvedDirection): TokenGroup {
  const palette = { ...DEFAULT_PALETTE, ...options.palette };
  const neutral = palette.neutral;
  const fonts = { ...SYSTEM_FONTS, ...options.fonts };
  const scale = {
    baseMin: 1,
    baseMax: 1.125,
    ...RATIO_BY_CONTRAST[direction.contrast],
    viewport: { min: 20, max: 80 },
    ...options.typeScale,
  };
  const factor = MOTION[direction.motion].durationFactor;
  const elevation = SHADOWS[direction.elevation];

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
  for (const [name, value] of Object.entries(RADIUS_BY_SHAPE[direction.shape])) {
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

interface ColorStep {
  ramp: string;
  step: RampStep;
}
const ref = ({ ramp, step }: ColorStep): string => `{primitive.color.${ramp}.${step}}`;

/** Points a semantic color at primitives for light and (optionally) dark mode. */
function setColor(semantic: TokenGroup, path: string[], light: ColorStep, dark?: ColorStep): void {
  let group = semantic;
  for (const key of path.slice(0, -1)) group = group[key] as TokenGroup;
  const token = group[path.at(-1) ?? ""] as Token;
  token.$value = ref(light);
  const modes = token.$extensions?.["com.idrovocmich.ws"]?.modes;
  if (dark && modes) modes.dark = ref(dark);
}

const neighbour = (step: RampStep, direction: 1 | -1): RampStep => {
  const i = RAMP_STEPS.indexOf(step);
  return RAMP_STEPS[i + direction] ?? RAMP_STEPS[i - direction] ?? step;
};

/** Light or dark neutral text, whichever reads better on the given color. */
function onColor(primitive: TokenGroup, background: ColorStep): ColorStep {
  const neutral = primitive["color"] as Record<string, Record<string, Token>>;
  const bg = neutral[background.ramp]?.[String(background.step)]?.$value as OklchColor;
  const light = neutral["neutral"]?.["50"]?.$value as OklchColor;
  const dark = neutral["neutral"]?.["950"]?.$value as OklchColor;
  return contrastRatio(light, bg) >= contrastRatio(dark, bg)
    ? { ramp: "neutral", step: 50 }
    : { ramp: "neutral", step: 950 };
}

/**
 * Semantic decisions that depend on the brand: the primary action uses the exact brand color
 * (its ramp anchor) and line strength follows the contrast control.
 */
function brandSemantics(
  semantic: TokenGroup,
  primitive: TokenGroup,
  primary: OklchInput,
  direction: ResolvedDirection,
): TokenGroup {
  const anchor = generateRamp(primary).anchor ?? 600;
  // Light mode always shows the exact brand color; dark mode keeps it when it is light enough.
  const lightAction: ColorStep = { ramp: "primary", step: anchor };
  const darkAction: ColorStep = {
    ramp: "primary",
    step: anchor >= 300 && anchor <= 500 ? anchor : 400,
  };
  // Hover moves away from the text color, so the label keeps (or gains) contrast.
  const lightOn = onColor(primitive, lightAction);
  const darkOn = onColor(primitive, darkAction);
  const awayFrom = (on: ColorStep): 1 | -1 => (on.step === 50 ? 1 : -1);
  const lightHover: ColorStep = { ramp: "primary", step: neighbour(anchor, awayFrom(lightOn)) };
  const darkHover: ColorStep = {
    ramp: "primary",
    step: neighbour(darkAction.step, awayFrom(darkOn)),
  };
  setColor(semantic, ["color", "action", "primary"], lightAction, darkAction);
  setColor(semantic, ["color", "action", "primary-hover"], lightHover, darkHover);
  setColor(semantic, ["color", "action", "on-primary"], lightOn, darkOn);

  const lines = LINES_BY_CONTRAST[direction.contrast];
  const neutral = (step: number): ColorStep => ({ ramp: "neutral", step: step as RampStep });
  setColor(
    semantic,
    ["color", "line", "subtle"],
    neutral(lines.subtle[0]),
    neutral(lines.subtle[1]),
  );
  setColor(
    semantic,
    ["color", "line", "strong"],
    neutral(lines.strong[0]),
    neutral(lines.strong[1]),
  );
  return semantic;
}

/** Builds the full three-tier token tree; with no options it is the neutral engine default. */
export function createTokens(options: EngineOptions = {}): TokenTree {
  const direction = resolveDirectionOptions(options.direction);
  const primitive = mergeGroups(
    mergeGroups(asGroup(primitiveTokens), generatedPrimitives(options, direction)),
    directionPrimitives(direction, options.displayWeights),
  );
  const primary = { ...DEFAULT_PALETTE, ...options.palette }.primary;
  return {
    primitive,
    semantic: brandSemantics(asGroup(semanticTokens), primitive, primary, direction),
    component: asGroup(componentTokens),
  };
}
