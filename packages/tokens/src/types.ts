/** W3C DTCG (2025.10) value shapes used by the engine. */

export type Reference = `{${string}}`;

export interface OklchColor {
  colorSpace: "oklch";
  /** [L (0–1), C (0–0.4), H (0–360)] */
  components: [number, number, number];
  alpha?: number;
}

export interface Dimension {
  value: number;
  unit: "px" | "rem" | "em";
}

export interface Duration {
  value: number;
  unit: "ms" | "s";
}

export type CubicBezier = [number, number, number, number];

export interface ShadowValue {
  color: OklchColor | Reference;
  offsetX: Dimension | Reference;
  offsetY: Dimension | Reference;
  blur: Dimension | Reference;
  spread: Dimension | Reference;
  inset?: boolean;
}

export interface BorderValue {
  color: OklchColor | Reference;
  width: Dimension | Reference;
  style: "solid" | "dashed" | "dotted";
}

export type TokenType =
  | "color"
  | "dimension"
  | "duration"
  | "cubicBezier"
  | "fontFamily"
  | "fontWeight"
  | "number"
  | "shadow"
  | "border";

export type TokenValue =
  | Reference
  | OklchColor
  | Dimension
  | Duration
  | CubicBezier
  | string
  | string[]
  | number
  | ShadowValue
  | ShadowValue[]
  | BorderValue;

/** How a foreground color is used, which sets its WCAG AA minimum. */
export type ContrastUse = "text" | "large-text" | "ui";

export interface ContrastRequirement {
  against: Reference;
  use: ContrastUse;
}

/** Engine-specific metadata, stored under `$extensions["com.idrovocmich.ws"]`. */
export interface WsExtensions {
  /** Value used in dark mode; `$value` is the light-mode value. */
  modes?: { dark?: TokenValue };
  /** Backgrounds this color must be legible against (WCAG AA). */
  contrast?: ContrastRequirement[];
  /** Fluid dimension: `$value` is the minimum, scaled up to `max` between the viewport bounds (rem). */
  fluid?: { max: Dimension; viewport?: { min: number; max: number } };
}

export const EXT = "com.idrovocmich.ws";

export interface Token {
  $value: TokenValue;
  $type: TokenType;
  $description?: string;
  $extensions?: { "com.idrovocmich.ws"?: WsExtensions; [vendor: string]: unknown };
}

export interface TokenGroup {
  $description?: string;
  [key: string]: Token | TokenGroup | string | undefined;
}

export type Tier = "primitive" | "semantic" | "component";

export const TIERS: readonly Tier[] = ["primitive", "semantic", "component"];

export interface TokenTree {
  primitive: TokenGroup;
  semantic: TokenGroup;
  component: TokenGroup;
}

export type Mode = "light" | "dark";
