import { z } from "zod";

export interface BrandIssue {
  /** Field path, e.g. `typography.display.family` or `logos.variants[0].file`. */
  path: string;
  message: string;
}

export function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((key, i) => (typeof key === "number" ? `[${key}]` : `${i === 0 ? "" : "."}${String(key)}`))
    .join("");
}

/** Spanish messages for every check zod does not have a custom message for. */
export const spanishErrors = z.locales.es().localeError;

export function issuesFromZod(error: z.ZodError): BrandIssue[] {
  return error.issues.map((issue) => {
    // Unknown keys usually mean a typo, so name them explicitly.
    if (issue.code === "unrecognized_keys") {
      return {
        path: formatPath(issue.path) || "(raíz)",
        message: `Campo no reconocido: ${issue.keys.map((k) => `"${k}"`).join(", ")}. Revisa si está mal escrito.`,
      };
    }
    return { path: formatPath(issue.path) || "(raíz)", message: issue.message };
  });
}

export class BrandValidationError extends Error {
  override name = "BrandValidationError";
  readonly issues: BrandIssue[];

  constructor(brandLabel: string, issues: BrandIssue[]) {
    const list = issues.map((i) => `  • ${i.path}: ${i.message}`).join("\n");
    super(
      `La marca ${brandLabel} no cumple el contrato (${issues.length} ${issues.length === 1 ? "problema" : "problemas"}):\n${list}`,
    );
    this.issues = issues;
  }
}
