import data from "../generated/brand-data.json";

export const { brand, light, dark, contrast } = data;

export type SpecimenToken = (typeof light)[number];

/** Tokens of one tier whose path starts with `prefix` (path excludes the tier). */
export function tokensUnder(
  tier: "primitive" | "semantic" | "component",
  ...prefix: string[]
): SpecimenToken[] {
  return light.filter((t) => t.path[0] === tier && prefix.every((p, i) => t.path[i + 1] === p));
}

/** Google Fonts stylesheet URL for every role sourced from Google, or null. */
export function googleFontsHref(): string | null {
  const roles = [brand.typography.display, brand.typography.body, brand.typography.mono];
  const families = roles.flatMap((r) =>
    r?.source.kind === "google"
      ? [
          `family=${encodeURIComponent(r.family).replace(/%20/g, "+")}:wght@${[...r.weights].sort((a, b) => a - b).join(";")}`,
        ]
      : [],
  );
  return families.length
    ? `https://fonts.googleapis.com/css2?${[...new Set(families)].join("&")}&display=swap`
    : null;
}

export const logoSrc = (file: string): string => `/brand/${file}`;
