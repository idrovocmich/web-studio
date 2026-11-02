import StyleDictionary from "style-dictionary";
import type { DesignTokens, TransformedToken } from "style-dictionary/types";
import { colorToCss } from "./color.js";
import { isReference, refId, withMode, wsExtensions } from "./tree.js";
import type {
  BorderValue,
  Dimension,
  Mode,
  OklchColor,
  ShadowValue,
  Token,
  TokenTree,
} from "./types.js";

const round = (n: number): number => Number(n.toFixed(4));
const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "math",
  "emoji",
]);

/** CSS custom property name: primitives get a `ref` segment so they read as "do not use directly". */
export function cssVarName(path: readonly string[]): string {
  const [tier, ...rest] = path;
  return `--ws-${[...(tier === "primitive" ? ["ref"] : []), ...rest].join("-")}`;
}

// Inside composite values, resolved references arrive already converted to CSS strings.
function dimension(d: Dimension | string): string {
  return typeof d === "string" ? d : `${round(d.value)}${d.unit}`;
}

function color(c: OklchColor | string): string {
  return typeof c === "string" ? c : colorToCss(c);
}

function fluid(min: Dimension, max: Dimension, viewport = { min: 20, max: 80 }): string {
  const slope = (max.value - min.value) / (viewport.max - viewport.min);
  const intercept = min.value - slope * viewport.min;
  return `clamp(${dimension(min)}, ${round(intercept)}rem + ${round(slope * 100)}vw, ${dimension(max)})`;
}

function shadow(s: ShadowValue): string {
  const parts = [s.offsetX, s.offsetY, s.blur, s.spread].map((d) =>
    dimension(d as Dimension | string),
  );
  return `${s.inset ? "inset " : ""}${parts.join(" ")} ${color(s.color as OklchColor | string)}`;
}

/** Converts a resolved DTCG value into its CSS representation. */
function toCss(token: TransformedToken): string {
  const value = token.$value as unknown;
  switch (token.$type) {
    case "color":
      return colorToCss(value as OklchColor);
    case "dimension": {
      const max = wsExtensions(token as unknown as Token)?.fluid;
      return max ? fluid(value as Dimension, max.max, max.viewport) : dimension(value as Dimension);
    }
    case "duration": {
      const d = value as { value: number; unit: string };
      return `${d.value}${d.unit}`;
    }
    case "cubicBezier":
      return `cubic-bezier(${(value as number[]).join(", ")})`;
    case "fontFamily": {
      const list = Array.isArray(value) ? (value as string[]) : [String(value)];
      return list.map((f) => (GENERIC_FAMILIES.has(f) ? f : `"${f}"`)).join(", ");
    }
    case "shadow":
      return Array.isArray(value)
        ? (value as ShadowValue[]).map(shadow).join(", ")
        : shadow(value as ShadowValue);
    case "border": {
      const b = value as BorderValue;
      return `${dimension(b.width as Dimension | string)} ${b.style} ${color(b.color as OklchColor | string)}`;
    }
    default:
      return String(value);
  }
}

export interface CssToken {
  name: string;
  path: string[];
  type: string;
  /** Value written to CSS: a `var()` for aliases, otherwise the resolved value. */
  css: string;
  /** Fully resolved value, always literal. */
  resolved: string;
}

async function transformMode(tree: TokenTree, mode: Mode): Promise<CssToken[]> {
  const sd = new StyleDictionary(
    {
      tokens: withMode(tree, mode) as unknown as DesignTokens,
      usesDtcg: true,
      log: { verbosity: "silent", warnings: "disabled" },
      hooks: {
        transforms: {
          "ws/css": { type: "value", transitive: true, transform: (token) => toCss(token) },
        },
      },
      platforms: { css: { transforms: ["ws/css"] } },
    },
    { verbosity: "silent", warnings: "disabled" },
  );
  const dictionary = await sd.getPlatformTokens("css");
  return dictionary.allTokens.map((token) => {
    const original = token.original.$value;
    // Composite values with nested references are resolved after transforms run, so convert them here.
    const resolved = typeof token.$value === "string" ? token.$value : toCss(token);
    return {
      name: cssVarName(token.path),
      path: token.path,
      type: String(token.$type),
      css: isReference(original) ? `var(${cssVarName(refId(original).split("."))})` : resolved,
      resolved,
    };
  });
}

/** Tailwind v4 theme namespace for each semantic group (path after `semantic`). */
const THEME_NAMESPACES: { prefix: string[]; namespace: string; literal?: boolean }[] = [
  { prefix: ["color"], namespace: "color" },
  { prefix: ["font", "family"], namespace: "font" },
  { prefix: ["font", "weight"], namespace: "font-weight" },
  { prefix: ["text"], namespace: "text" },
  { prefix: ["leading"], namespace: "leading" },
  { prefix: ["tracking"], namespace: "tracking" },
  { prefix: ["space"], namespace: "spacing" },
  { prefix: ["radius"], namespace: "radius" },
  { prefix: ["shadow"], namespace: "shadow" },
  { prefix: ["motion", "ease"], namespace: "ease" },
  // Media queries cannot read custom properties, so breakpoints are written as literals.
  { prefix: ["breakpoint"], namespace: "breakpoint", literal: true },
  { prefix: ["layout", "container"], namespace: "container" },
];

/** Default Tailwind values removed so only brand tokens exist ("non-generic" by construction). */
const THEME_RESETS = [
  "color",
  "font",
  "text",
  "radius",
  "shadow",
  "ease",
  "breakpoint",
  "container",
];

function themeBlock(tokens: CssToken[]): string {
  const lines = THEME_RESETS.map((ns) => `  --${ns}-*: initial;`);
  for (const token of tokens) {
    const [tier, ...rest] = token.path;
    if (tier !== "semantic") continue;
    const match = THEME_NAMESPACES.find((m) => m.prefix.every((p, i) => rest[i] === p));
    if (!match) continue;
    const key = rest.slice(match.prefix.length).join("-");
    lines.push(
      `  --${match.namespace}-${key}: ${match.literal ? token.resolved : `var(${token.name})`};`,
    );
  }
  return `@theme inline {\n${lines.join("\n")}\n}\n`;
}

const declarations = (tokens: CssToken[], indent = "  "): string =>
  tokens.map((t) => `${indent}${t.name}: ${t.css};`).join("\n");

const HEADER = "/* Generated by @idrovocmich/tokens. Do not edit by hand. */\n";

export interface BuildOutput {
  /** CSS custom properties for light mode, dark mode and forced themes. */
  tokensCss: string;
  /** Tailwind CSS v4 `@theme inline` block mapping semantic tokens to utilities. */
  themeCss: string;
  light: CssToken[];
  dark: CssToken[];
}

export async function buildTokens(tree: TokenTree): Promise<BuildOutput> {
  const light = await transformMode(tree, "light");
  const darkAll = await transformMode(tree, "dark");
  const lightByName = new Map(light.map((t) => [t.name, t]));
  const dark = darkAll.filter((t) => lightByName.get(t.name)?.css !== t.css);
  const lightOfDark = dark.flatMap((t) => lightByName.get(t.name) ?? []);

  const tokensCss = [
    HEADER,
    `:root {\n  color-scheme: light dark;\n${declarations(light)}\n}\n`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${declarations(dark, "    ")}\n  }\n}\n`,
    `[data-theme="dark"] {\n  color-scheme: dark;\n${declarations(dark)}\n}\n`,
    `[data-theme="light"] {\n  color-scheme: light;\n${declarations(lightOfDark)}\n}\n`,
  ].join("\n");

  return { tokensCss, themeCss: HEADER + themeBlock(light), light, dark };
}
