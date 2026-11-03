import { z } from "zod";
import { pageSchema, siteSchema, type Page, type Site } from "./schema.js";

export interface ContentIssue {
  /** Field path, e.g. `sections[2].items[0].title`. */
  path: string;
  message: string;
}

export function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((key, i) => (typeof key === "number" ? `[${key}]` : `${i === 0 ? "" : "."}${String(key)}`))
    .join("");
}

const spanishErrors = z.locales.es().localeError;

function issuesFromZod(error: z.ZodError): ContentIssue[] {
  return error.issues.map((issue) => ({
    path: formatPath(issue.path) || "(raíz)",
    message:
      issue.code === "unrecognized_keys"
        ? `Campo no reconocido: ${issue.keys.map((k) => `"${k}"`).join(", ")}. Revisa si está mal escrito.`
        : issue.message,
  }));
}

export class ContentValidationError extends Error {
  override name = "ContentValidationError";
  readonly issues: ContentIssue[];

  constructor(label: string, issues: ContentIssue[]) {
    const list = issues.map((i) => `  • ${i.path}: ${i.message}`).join("\n");
    super(
      `El contenido ${label} no es válido (${issues.length} ${issues.length === 1 ? "problema" : "problemas"}):\n${list}`,
    );
    this.issues = issues;
  }
}

export type ContentResult<T> = { ok: true; data: T } | { ok: false; issues: ContentIssue[] };

function check<T>(schema: z.ZodType<T>, input: unknown): ContentResult<T> {
  const parsed = schema.safeParse(input, { error: spanishErrors });
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, issues: issuesFromZod(parsed.error) };
}

export const validatePage = (input: unknown): ContentResult<Page> => check(pageSchema, input);
export const validateSite = (input: unknown): ContentResult<Site> => check(siteSchema, input);

/** Validates and returns a page, or throws `ContentValidationError` with Spanish messages. */
export function parsePage(input: unknown, label = "de la página"): Page {
  const result = validatePage(input);
  if (!result.ok) throw new ContentValidationError(label, result.issues);
  return result.data;
}

/** Validates and returns the site settings, or throws `ContentValidationError`. */
export function parseSite(input: unknown, label = "del sitio"): Site {
  const result = validateSite(input);
  if (!result.ok) throw new ContentValidationError(label, result.issues);
  return result.data;
}
