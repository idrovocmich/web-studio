/**
 * @idrovocmich/brand-contract
 * The contract every brand must satisfy and the function that turns a valid brand into tokens.
 * File-system helpers live in `@idrovocmich/brand-contract/node`.
 */
export { brandSchema, oklchColor } from "./schema.js";
export type { Brand, BrandInput } from "./schema.js";
export { BrandValidationError, formatPath } from "./errors.js";
export type { BrandIssue } from "./errors.js";
export { brandToEngineOptions, resolveBrand, validateBrand } from "./resolve.js";
export type { ResolvedBrand, ValidationResult } from "./resolve.js";
