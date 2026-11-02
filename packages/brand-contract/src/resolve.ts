import {
  buildTokens,
  createTokens,
  validateTokens,
  type ContrastResult,
  type EngineOptions,
  type TokenTree,
} from "@idrovocmich/tokens";
import { BrandValidationError, issuesFromZod, spanishErrors, type BrandIssue } from "./errors.js";
import { brandSchema, type Brand } from "./schema.js";

export type ValidationResult = { ok: true; brand: Brand } | { ok: false; issues: BrandIssue[] };

/** Checks a brand against the contract without building tokens. */
export function validateBrand(input: unknown): ValidationResult {
  const parsed = brandSchema.safeParse(input, { error: spanishErrors });
  return parsed.success
    ? { ok: true, brand: parsed.data }
    : { ok: false, issues: issuesFromZod(parsed.error) };
}

/** Maps the brand contract onto the token engine's options. */
export function brandToEngineOptions(brand: Brand): EngineOptions {
  const { display, body, mono } = brand.typography;
  const options: EngineOptions = {
    palette: {
      primary: brand.palette.primary,
      accent: brand.palette.accent,
      neutral: brand.palette.neutral,
      ...(brand.palette.success && { success: brand.palette.success }),
      ...(brand.palette.warning && { warning: brand.palette.warning }),
      ...(brand.palette.danger && { danger: brand.palette.danger }),
    },
    fonts: {
      display: [display.family, ...display.fallback],
      body: [body.family, ...body.fallback],
      ...(mono && { mono: [mono.family, ...mono.fallback] }),
    },
  };
  if (brand.typography.scale) {
    options.typeScale = Object.fromEntries(
      Object.entries(brand.typography.scale).filter(([, v]) => v !== undefined),
    );
  }
  if (brand.style?.shape) options.shape = brand.style.shape;
  if (brand.style?.motion) options.motion = brand.style.motion;
  if (brand.style?.elevation) options.elevation = brand.style.elevation;
  return options;
}

const CONTRAST_HINT: Record<string, string> = {
  primary: "ajusta la luminosidad (l) de palette.primary",
  accent: "ajusta la luminosidad (l) o el croma (c) de palette.accent",
  neutral: "baja el croma (c) de palette.neutral",
  success: "ajusta palette.success",
  warning: "ajusta palette.warning",
  danger: "ajusta palette.danger",
};

function contrastIssue(result: ContrastResult): BrandIssue {
  const role = Object.keys(CONTRAST_HINT).find(
    (r) => result.foreground.includes(r) || result.background.includes(r),
  );
  const hint = role ? ` Sugerencia: ${CONTRAST_HINT[role]}.` : "";
  return { path: "palette", message: `${result.message}${hint}` };
}

export interface ResolvedBrand {
  brand: Brand;
  /** Final three-tier DTCG token tree for this brand. */
  tokens: TokenTree;
  css: {
    /** CSS custom properties (light, dark and forced themes). */
    tokens: string;
    /** Tailwind CSS v4 `@theme inline` block. */
    theme: string;
  };
  contrast: ContrastResult[];
}

/**
 * Validates a brand and produces its final tokens and CSS.
 * Throws `BrandValidationError` with Spanish messages when the brand is incomplete or fails WCAG AA.
 */
export async function resolveBrand(input: unknown): Promise<ResolvedBrand> {
  const result = validateBrand(input);
  const label =
    typeof input === "object" && input !== null && "id" in input
      ? `"${String(input.id)}"`
      : "(sin id)";
  if (!result.ok) throw new BrandValidationError(label, result.issues);

  const tokens = createTokens(brandToEngineOptions(result.brand));
  const report = validateTokens(tokens);
  if (report.tiers.length > 0) {
    throw new BrandValidationError(
      label,
      report.tiers.map((i) => ({ path: i.token, message: i.message })),
    );
  }
  if (report.contrastFailures.length > 0) {
    throw new BrandValidationError(label, report.contrastFailures.map(contrastIssue));
  }

  const built = await buildTokens(tokens);
  return {
    brand: result.brand,
    tokens,
    css: { tokens: built.tokensCss, theme: built.themeCss },
    contrast: report.contrast,
  };
}
