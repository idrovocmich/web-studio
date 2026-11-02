import { checkContrast, type ContrastResult } from "./contrast.js";
import { flatten, getToken, isReference, referencesIn, wsExtensions } from "./tree.js";
import type { Tier, TokenTree, TokenValue } from "./types.js";

export interface TierIssue {
  token: string;
  message: string;
}

/** Which tiers each tier may reference. */
const ALLOWED: Record<Tier, readonly Tier[]> = {
  primitive: ["primitive"],
  semantic: ["primitive", "semantic"],
  component: ["semantic"],
};

const TIER_LABEL: Record<Tier, string> = {
  primitive: "primitivo",
  semantic: "semántico",
  component: "de componente",
};

/** True when a component value carries a raw value instead of pointing at a semantic token. */
function hasLiteral(value: TokenValue): boolean {
  if (isReference(value)) return false;
  if (typeof value === "string") return false;
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return Object.values(value).some(
      (v) => typeof v === "number" || (typeof v === "object" && v !== null && !isReference(v)),
    );
  }
  return true;
}

export function validateTiers(tree: TokenTree): TierIssue[] {
  const issues: TierIssue[] = [];
  for (const { id, tier, token } of flatten(tree)) {
    const ext = wsExtensions(token);
    const refs = [
      ...referencesIn(token.$value),
      ...(ext?.modes?.dark !== undefined ? referencesIn(ext.modes.dark) : []),
      ...(ext?.contrast ?? []).flatMap((c) => referencesIn(c.against)),
    ];
    for (const ref of refs) {
      if (!getToken(tree, ref)) {
        issues.push({ token: id, message: `referencia {${ref}} no existe.` });
        continue;
      }
      const target = ref.split(".")[0] as Tier;
      if (!ALLOWED[tier].includes(target)) {
        issues.push({
          token: id,
          message: `un token ${TIER_LABEL[tier]} no puede usar el token ${TIER_LABEL[target]} {${ref}}. Permitidos: ${ALLOWED[tier].map((t) => TIER_LABEL[t]).join(", ")}.`,
        });
      }
    }
    if (tier === "component" && hasLiteral(token.$value)) {
      issues.push({
        token: id,
        message:
          "los tokens de componente solo pueden usar referencias a tokens semánticos, no valores directos.",
      });
    }
  }
  return issues;
}

export interface ValidationReport {
  ok: boolean;
  tiers: TierIssue[];
  contrast: ContrastResult[];
  contrastFailures: ContrastResult[];
}

export function validateTokens(tree: TokenTree): ValidationReport {
  const tiers = validateTiers(tree);
  const contrast = tiers.length === 0 ? checkContrast(tree) : [];
  const contrastFailures = contrast.filter((r) => !r.pass);
  return {
    ok: tiers.length === 0 && contrastFailures.length === 0,
    tiers,
    contrast,
    contrastFailures,
  };
}

export function formatReport(report: ValidationReport): string {
  const lines = [
    ...report.tiers.map((i) => `• ${i.token}: ${i.message}`),
    ...report.contrastFailures.map((r) => `• ${r.message}`),
  ];
  return lines.length ? `Los tokens no son válidos:\n${lines.join("\n")}` : "Tokens válidos.";
}
