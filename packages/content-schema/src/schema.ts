import { z } from "zod";

const text = (what: string, min = 1) =>
  z
    .string({ error: `Falta ${what}.` })
    .trim()
    .min(min, {
      error: min > 1 ? `${what} debe tener al menos ${min} caracteres.` : `Falta ${what}.`,
    });

const href = z
  .string({ error: "Falta el destino del enlace (href)." })
  .trim()
  .regex(/^(\/|#|https?:\/\/|mailto:|tel:)/, {
    error: 'El enlace debe empezar por "/", "#", "https://", "mailto:" o "tel:".',
  });

export const linkSchema = z.strictObject({ label: text("el texto del enlace"), href });

/** Image or video slot. Without `src` the section shows a placeholder described by `alt`. */
export const mediaSchema = z.strictObject({
  src: z.string().trim().min(1).optional(),
  alt: text("el texto alternativo (alt) de la imagen"),
});

/** `variant: "auto"` lets the section pick its composition from the brand's art direction. */
const base = <const V extends readonly [string, ...string[]]>(variants: V) => ({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, { error: "El id de sección solo admite minúsculas, números y guiones." })
    .optional(),
  variant: z
    .enum(["auto", ...variants], {
      error: `La variante debe ser "auto" o una de: ${variants.map((v) => `"${v}"`).join(", ")}.`,
    })
    .default("auto"),
  /** The page's one memorable decision. At most one section per page. */
  signature: z.boolean().default(false),
});

export const HERO_VARIANTS = ["editorial", "typographic", "split-media"] as const;
export const MANIFESTO_VARIANTS = ["monumental", "columns", "principles"] as const;
export const FEATURES_VARIANTS = ["bento", "index", "lead-list"] as const;
export const PROOF_VARIANTS = ["figures", "cases", "logos"] as const;
export const CTA_VARIANTS = ["statement", "split-form", "band"] as const;
export const HEADER_VARIANTS = ["minimal", "editorial", "technical"] as const;
export const FOOTER_VARIANTS = ["minimal", "index", "signature"] as const;

export const heroSchema = z
  .strictObject({
    type: z.literal("hero"),
    ...base(HERO_VARIANTS),
    eyebrow: z.string().trim().optional(),
    title: text("el titular del hero"),
    lead: z.string().trim().optional(),
    /** One primary action. A second, low-emphasis link is optional; never two buttons. */
    action: linkSchema.optional(),
    secondary: linkSchema.optional(),
    media: mediaSchema.optional(),
  })
  .refine((s) => s.variant !== "split-media" || s.media, {
    error: 'La variante "split-media" necesita una imagen (media).',
    path: ["media"],
  });

export const manifestoSchema = z
  .strictObject({
    type: z.literal("manifesto"),
    ...base(MANIFESTO_VARIANTS),
    eyebrow: z.string().trim().optional(),
    statement: text("la frase del manifiesto (statement)", 10),
    body: z.array(z.string().trim().min(1)).default([]),
    principles: z.array(z.string().trim().min(1)).default([]),
  })
  .refine((s) => s.variant !== "principles" || s.principles.length >= 3, {
    error: 'La variante "principles" necesita al menos 3 principios.',
    path: ["principles"],
  });

const featureItem = z.strictObject({
  title: text("el título del rasgo"),
  body: text("la descripción del rasgo"),
  media: mediaSchema.optional(),
});

export const featuresSchema = z.strictObject({
  type: z.literal("features"),
  ...base(FEATURES_VARIANTS),
  eyebrow: z.string().trim().optional(),
  title: text("el título de la sección de rasgos"),
  intro: z.string().trim().optional(),
  items: z
    .array(featureItem)
    .min(3, { error: "Añade al menos 3 rasgos." })
    .max(9, { error: "Como máximo 9 rasgos: si hay más, divide la sección." }),
});

const figure = z.strictObject({
  value: text("la cifra"),
  label: text("qué mide la cifra"),
  source: z.string().trim().optional(),
});
const proofCase = z.strictObject({
  title: text("el título del caso"),
  summary: text("el resumen del caso"),
  result: text("el resultado del caso"),
  href: href.optional(),
});
const logo = z.strictObject({
  name: text("el nombre del cliente o medio"),
  src: z.string().optional(),
});

export const proofSchema = z
  .strictObject({
    type: z.literal("proof"),
    ...base(PROOF_VARIANTS),
    eyebrow: z.string().trim().optional(),
    title: z.string().trim().optional(),
    figures: z.array(figure).default([]),
    cases: z.array(proofCase).default([]),
    logos: z.array(logo).default([]),
    /** Why these logos matter. A wall of logos without context is generic. */
    logosContext: z.string().trim().optional(),
  })
  .superRefine((s, ctx) => {
    if (s.figures.length + s.cases.length + s.logos.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "La sección de prueba necesita cifras, casos o logos.",
        path: [],
      });
    }
    if (s.variant === "figures" && s.figures.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: 'La variante "figures" necesita al menos 2 cifras.',
        path: ["figures"],
      });
    }
    if (s.variant === "cases" && s.cases.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: 'La variante "cases" necesita al menos un caso.',
        path: ["cases"],
      });
    }
    if (s.logos.length > 0 && !s.logosContext) {
      ctx.addIssue({
        code: "custom",
        message:
          "Explica por qué importan estos logos (logosContext): un muro de logos sin contexto es genérico.",
        path: ["logosContext"],
      });
    }
    if (s.variant === "logos" && s.logos.length < 3) {
      ctx.addIssue({
        code: "custom",
        message: 'La variante "logos" necesita al menos 3 logos.',
        path: ["logos"],
      });
    }
  });

export const ctaSchema = z
  .strictObject({
    type: z.literal("cta"),
    ...base(CTA_VARIANTS),
    title: text("el titular de la llamada a la acción"),
    body: z.string().trim().optional(),
    /** A single action: a CTA with two competing buttons is generic. */
    action: linkSchema,
    form: z
      .strictObject({
        action: href,
        submitLabel: text("el texto del botón del formulario"),
      })
      .optional(),
  })
  .refine((s) => s.variant !== "split-form" || s.form, {
    error: 'La variante "split-form" necesita un formulario (form).',
    path: ["form"],
  });

export const sectionSchema = z.discriminatedUnion(
  "type",
  [heroSchema, manifestoSchema, featuresSchema, proofSchema, ctaSchema],
  {
    error:
      'Tipo de sección desconocido (type). Usa "hero", "manifesto", "features", "proof" o "cta".',
  },
);

export const pageSchema = z
  .strictObject({
    slug: z
      .string({ error: "Falta el slug de la página." })
      .regex(/^([a-z0-9-]+(\/[a-z0-9-]+)*)?$/, {
        error: 'El slug solo admite minúsculas, números, guiones y "/" (vacío para la portada).',
      }),
    title: text("el título de la página (SEO)"),
    description: z
      .string({ error: "Falta la descripción de la página (SEO)." })
      .trim()
      .min(50, { error: "La descripción debe tener entre 50 y 160 caracteres." })
      .max(160, { error: "La descripción debe tener entre 50 y 160 caracteres." }),
    sections: z.array(sectionSchema).min(1, { error: "La página necesita al menos una sección." }),
  })
  .superRefine((page, ctx) => {
    const signatures = page.sections.map((s, i) => (s.signature ? i : -1)).filter((i) => i >= 0);
    for (const i of signatures.slice(1)) {
      ctx.addIssue({
        code: "custom",
        path: ["sections", i, "signature"],
        message: `Solo una sección por página puede ser la firma; ya lo es la sección ${(signatures[0] ?? 0) + 1}. La audacia se concentra en una decisión.`,
      });
    }
    const ids = new Map<string, number>();
    page.sections.forEach((s, i) => {
      if (!s.id) return;
      const first = ids.get(s.id);
      if (first !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", i, "id"],
          message: `El id "${s.id}" ya lo usa la sección ${first + 1}.`,
        });
      } else ids.set(s.id, i);
    });
  });

export const siteSchema = z.strictObject({
  name: text("el nombre del sitio"),
  locale: z
    .string()
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/, { error: 'El idioma debe ser como "es" o "es-MX".' }),
  nav: z.array(linkSchema).max(7, { error: "Como máximo 7 enlaces en la navegación principal." }),
  header: z
    .strictObject({ variant: z.enum(["auto", ...HEADER_VARIANTS]).default("auto") })
    .default({ variant: "auto" }),
  footer: z.strictObject({
    variant: z.enum(["auto", ...FOOTER_VARIANTS]).default("auto"),
    note: z.string().trim().optional(),
    links: z.array(linkSchema).default([]),
  }),
  contact: z
    .strictObject({
      email: z.email({ error: "El correo de contacto no es válido." }).optional(),
      phone: z.string().trim().optional(),
      address: z.string().trim().optional(),
    })
    .optional(),
});

export type Link = z.output<typeof linkSchema>;
export type Media = z.output<typeof mediaSchema>;
export type HeroSection = z.output<typeof heroSchema>;
export type ManifestoSection = z.output<typeof manifestoSchema>;
export type FeaturesSection = z.output<typeof featuresSchema>;
export type ProofSection = z.output<typeof proofSchema>;
export type CtaSection = z.output<typeof ctaSchema>;
export type Section = z.output<typeof sectionSchema>;
export type SectionType = Section["type"];
export type Page = z.output<typeof pageSchema>;
export type PageInput = z.input<typeof pageSchema>;
export type Site = z.output<typeof siteSchema>;
export type SiteInput = z.input<typeof siteSchema>;
