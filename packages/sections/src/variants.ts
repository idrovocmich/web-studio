import type { Composition } from "@idrovocmich/brand-contract";
import type {
  CtaSection,
  FEATURES_VARIANTS,
  FeaturesSection,
  FOOTER_VARIANTS,
  HEADER_VARIANTS,
  HeroSection,
  HERO_VARIANTS,
  CTA_VARIANTS,
  MANIFESTO_VARIANTS,
  ManifestoSection,
  PROOF_VARIANTS,
  ProofSection,
  Site,
} from "@idrovocmich/content-schema";

export type HeroVariant = (typeof HERO_VARIANTS)[number];
export type ManifestoVariant = (typeof MANIFESTO_VARIANTS)[number];
export type FeaturesVariant = (typeof FEATURES_VARIANTS)[number];
export type ProofVariant = (typeof PROOF_VARIANTS)[number];
export type CtaVariant = (typeof CTA_VARIANTS)[number];
export type HeaderVariant = (typeof HEADER_VARIANTS)[number];
export type FooterVariant = (typeof FOOTER_VARIANTS)[number];

/*
 * "auto" variants are chosen from the composition so the same content gets a different
 * structure per brand. Each picker falls back when the content cannot fill a variant
 * (no media, too few principles, no form…). Explicit variants are respected; the content
 * schema already rejects explicit variants the content cannot fill.
 */

export function heroVariant(section: HeroSection, c: Composition): HeroVariant {
  if (section.variant !== "auto") return section.variant;
  if (c.asymmetry === "strong") return "editorial";
  if (c.rhythm === "tight") return "typographic";
  return section.media ? "split-media" : "editorial";
}

export function manifestoVariant(section: ManifestoSection, c: Composition): ManifestoVariant {
  if (section.variant !== "auto") return section.variant;
  const hasPrinciples = section.principles.length >= 3;
  if (c.rhythm === "tight" && hasPrinciples) return "principles";
  if (c.headingScale === "monumental") return "monumental";
  if (c.asymmetry === "strong" || c.rhythm === "spacious") return "columns";
  return hasPrinciples ? "principles" : "columns";
}

export function featuresVariant(section: FeaturesSection, c: Composition): FeaturesVariant {
  if (section.variant !== "auto") return section.variant;
  if (c.rhythm === "tight") return "index";
  if (c.asymmetry === "strong") return "lead-list";
  return "bento";
}

export function proofVariant(section: ProofSection, c: Composition): ProofVariant {
  if (section.variant !== "auto") return section.variant;
  const figures = section.figures.length >= 2;
  const numeric = c.numerals === "tabular-nums" || c.numerals === "lining-nums";
  if (figures && numeric) return "figures";
  if (section.cases.length > 0) return "cases";
  if (section.logos.length >= 3) return "logos";
  return "figures";
}

export function ctaVariant(section: CtaSection, c: Composition): CtaVariant {
  if (section.variant !== "auto") return section.variant;
  if (c.surface === "outlined") return "band";
  return section.form ? "split-form" : "statement";
}

export function headerVariant(site: Site, c: Composition): HeaderVariant {
  if (site.header.variant !== "auto") return site.header.variant;
  if (c.eyebrow === "mono-caps") return "technical";
  if (c.eyebrow === "italic") return "editorial";
  return "minimal";
}

export function footerVariant(site: Site, c: Composition): FooterVariant {
  if (site.footer.variant !== "auto") return site.footer.variant;
  if (c.headingScale === "monumental") return "signature";
  if (c.rhythm === "spacious") return "index";
  return "minimal";
}

/** Two-digit index ("01", "02"…) used by numbered compositions. */
export const indexLabel = (i: number): string => String(i + 1).padStart(2, "0");
