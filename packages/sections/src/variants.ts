import type { Composition } from "@idrovocmich/brand-contract";
import type {
  COMPARISON_VARIANTS,
  ComparisonSection,
  CONTACT_VARIANTS,
  ContactSection,
  FAQ_VARIANTS,
  FaqSection,
  GALLERY_VARIANTS,
  GallerySection,
  METHOD_VARIANTS,
  MethodSection,
  STORY_VARIANTS,
  StorySection,
  TESTIMONIALS_VARIANTS,
  TestimonialsSection,
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
export type StoryVariant = (typeof STORY_VARIANTS)[number];
export type MethodVariant = (typeof METHOD_VARIANTS)[number];
export type GalleryVariant = (typeof GALLERY_VARIANTS)[number];
export type ComparisonVariant = (typeof COMPARISON_VARIANTS)[number];
export type TestimonialsVariant = (typeof TESTIMONIALS_VARIANTS)[number];
export type FaqVariant = (typeof FAQ_VARIANTS)[number];
export type ContactVariant = (typeof CONTACT_VARIANTS)[number];

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

export function storyVariant(section: StorySection, c: Composition): StoryVariant {
  if (section.variant !== "auto") return section.variant;
  const dated = section.chapters.every((ch) => ch.date);
  if (c.rhythm === "tight" && dated) return "timeline";
  if (c.media === "organic" || c.rhythm === "spacious") return "interleaved";
  return "scroll";
}

export function methodVariant(section: MethodSection, c: Composition): MethodVariant {
  if (section.variant !== "auto") return section.variant;
  if (c.rhythm === "tight") return "columns";
  if (c.rhythm === "spacious") return "steps";
  return "phases";
}

export function galleryVariant(section: GallerySection, c: Composition): GalleryVariant {
  if (section.variant !== "auto") return section.variant;
  if (c.rhythm === "tight") return "strip";
  if (c.asymmetry === "strong") return "feature";
  return "mosaic";
}

export function comparisonVariant(section: ComparisonSection, c: Composition): ComparisonVariant {
  if (section.variant !== "auto") return section.variant;
  if (c.rhythm === "tight") return "table";
  if (section.columns.some((col) => col.highlight)) return "plans";
  return section.columns.length === 2 ? "before-after" : "table";
}

export function testimonialsVariant(
  section: TestimonialsSection,
  c: Composition,
): TestimonialsVariant {
  if (section.variant !== "auto") return section.variant;
  const numeric = c.numerals === "tabular-nums" || c.numerals === "lining-nums";
  if (numeric && section.quotes[0]?.figure) return "with-figure";
  if (c.headingScale === "monumental" || section.quotes.length === 1) return "single";
  return "conversation";
}

export function faqVariant(section: FaqSection, c: Composition): FaqVariant {
  if (section.variant !== "auto") return section.variant;
  const topics = new Set(section.items.map((i) => i.topic));
  const grouped = section.items.every((i) => i.topic) && topics.size >= 2;
  if (c.rhythm === "tight") return "index";
  if (grouped && c.rhythm === "spacious") return "two-column";
  return "accordion";
}

export function contactVariant(section: ContactSection, c: Composition): ContactVariant {
  if (section.variant !== "auto") return section.variant;
  if (c.rhythm === "tight") return "steps";
  if (c.rhythm === "spacious") return "details";
  return "form-aside";
}

/** Two-digit index ("01", "02"…) used by numbered compositions. */
export const indexLabel = (i: number): string => String(i + 1).padStart(2, "0");
