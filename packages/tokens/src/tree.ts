import {
  EXT,
  type Mode,
  type Reference,
  type Tier,
  type Token,
  type TokenGroup,
  type TokenTree,
  type TokenValue,
  type WsExtensions,
} from "./types.js";

export interface FlatToken {
  /** Dot path, e.g. `semantic.color.content.primary`. */
  id: string;
  path: string[];
  tier: Tier;
  token: Token;
}

export function isToken(node: unknown): node is Token {
  return typeof node === "object" && node !== null && "$value" in node;
}

export function isReference(value: unknown): value is Reference {
  return typeof value === "string" && /^\{[^{}]+\}$/.test(value);
}

export function refId(ref: Reference): string {
  return ref.slice(1, -1);
}

export function wsExtensions(token: Token): WsExtensions | undefined {
  return token.$extensions?.[EXT];
}

/** Every reference id used anywhere inside a value (nested objects and arrays included). */
export function referencesIn(value: unknown): string[] {
  if (isReference(value)) return [refId(value)];
  if (Array.isArray(value)) return value.flatMap(referencesIn);
  if (typeof value === "object" && value !== null)
    return Object.values(value).flatMap(referencesIn);
  return [];
}

export function flatten(tree: TokenTree): FlatToken[] {
  const out: FlatToken[] = [];
  const walk = (node: TokenGroup, path: string[], tier: Tier): void => {
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$") || typeof child !== "object") continue;
      const childPath = [...path, key];
      if (isToken(child))
        out.push({ id: childPath.join("."), path: childPath, tier, token: child });
      else walk(child, childPath, tier);
    }
  };
  for (const tier of ["primitive", "semantic", "component"] as const)
    walk(tree[tier], [tier], tier);
  return out;
}

export function getToken(tree: TokenTree, id: string): Token | undefined {
  let node: unknown = tree;
  for (const key of id.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return isToken(node) ? node : undefined;
}

export class TokenReferenceError extends Error {
  override name = "TokenReferenceError";
}

/** Replaces every reference inside `value` with the referenced token's resolved value. */
export function resolveValue(tree: TokenTree, value: TokenValue, seen: string[] = []): TokenValue {
  if (isReference(value)) {
    const id = refId(value);
    if (seen.includes(id)) {
      throw new TokenReferenceError(`Referencia circular: ${[...seen, id].join(" → ")}`);
    }
    const target = getToken(tree, id);
    if (!target) throw new TokenReferenceError(`La referencia {${id}} no apunta a ningún token.`);
    return resolveValue(tree, target.$value, [...seen, id]);
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveValue(tree, v as TokenValue, seen)) as TokenValue;
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).map(([k, v]) => [
      k,
      typeof v === "object" || isReference(v) ? resolveValue(tree, v as TokenValue, seen) : v,
    ]);
    return Object.fromEntries(entries) as TokenValue;
  }
  return value;
}

/** Copy of the tree where tokens with a dark-mode value use it as `$value`. */
export function withMode(tree: TokenTree, mode: Mode): TokenTree {
  const copy = structuredClone(tree);
  if (mode === "light") return copy;
  for (const { token } of flatten(copy)) {
    const dark = wsExtensions(token)?.modes?.dark;
    if (dark !== undefined) token.$value = dark;
  }
  return copy;
}

/** Deep merge where `override` wins; arrays and token values are replaced, not merged. */
export function mergeGroups(base: TokenGroup, override: TokenGroup): TokenGroup {
  const out: TokenGroup = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    if (
      typeof value === "object" &&
      typeof current === "object" &&
      !isToken(value) &&
      !isToken(current)
    ) {
      out[key] = mergeGroups(current, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
