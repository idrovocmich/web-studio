/**
 * @idrovocmich/content-schema
 * Schemas that brand content (site settings and pages made of sections) must satisfy, with
 * Spanish errors and the engine's anti-generic rules: one signature section per page, one
 * primary action per section, logos only with context.
 */
export * from "./schema.js";
export {
  ContentValidationError,
  formatPath,
  parsePage,
  parseSite,
  validatePage,
  validateSite,
} from "./validate.js";
export type { ContentIssue, ContentResult } from "./validate.js";
