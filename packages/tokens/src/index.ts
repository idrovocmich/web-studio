/**
 * @idrovocmich/tokens
 * Three-tier W3C DTCG design tokens (primitive → semantic → component), a Style Dictionary
 * pipeline to CSS custom properties and a Tailwind CSS v4 `@theme` block, and WCAG AA checks.
 */
export * from "./types.js";
export { colorToCss, contrastRatio, generateRamp, oklch, RAMP_STEPS } from "./color.js";
export type { OklchInput, Ramp, RampStep } from "./color.js";
export { createTokens, DEFAULT_PALETTE } from "./generate.js";
export type {
  Elevation,
  EngineOptions,
  MotionPersonality,
  PaletteOptions,
  Shape,
  TypeScaleOptions,
} from "./generate.js";
export {
  flatten,
  getToken,
  isReference,
  resolveValue,
  TokenReferenceError,
  withMode,
} from "./tree.js";
export type { FlatToken } from "./tree.js";
export { AA_MINIMUM, checkContrast } from "./contrast.js";
export type { ContrastResult } from "./contrast.js";
export { formatReport, validateTiers, validateTokens } from "./validate.js";
export type { TierIssue, ValidationReport } from "./validate.js";
export { buildTokens, cssVarName } from "./build.js";
export type { BuildOutput, CssToken } from "./build.js";
