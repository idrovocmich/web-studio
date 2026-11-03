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

export const STORY_VARIANTS = ["scroll", "interleaved", "timeline"] as const;
export const METHOD_VARIANTS = ["steps", "columns", "phases"] as const;
export const GALLERY_VARIANTS = ["mosaic", "strip", "feature"] as const;
export const COMPARISON_VARIANTS = ["table", "before-after", "plans"] as const;
export const TESTIMONIALS_VARIANTS = ["single", "conversation", "with-figure"] as const;
export const FAQ_VARIANTS = ["accordion", "index", "two-column"] as const;
export const CONTACT_VARIANTS = ["form-aside", "details", "steps"] as const;

const chapter = z.strictObject({
  title: text("el título del capítulo"),
  body: text("el texto del capítulo"),
  date: z.string().trim().optional(),
  media: mediaSchema.optional(),
});

export const storySchema = z
  .strictObject({
    type: z.literal("story"),
    ...base(STORY_VARIANTS),
    eyebrow: z.string().trim().optional(),
    title: text("el título de la historia"),
    intro: z.string().trim().optional(),
    chapters: z.array(chapter).min(2, { error: "Una historia necesita al menos 2 capítulos." }),
  })
  .refine((s) => s.variant !== "timeline" || s.chapters.every((c) => c.date), {
    error: 'La variante "timeline" necesita una fecha (date) en cada capítulo.',
    path: ["chapters"],
  });

export const methodSchema = z.strictObject({
  type: z.literal("method"),
  ...base(METHOD_VARIANTS),
  eyebrow: z.string().trim().optional(),
  title: text("el título del método"),
  intro: z.string().trim().optional(),
  steps: z
    .array(
      z.strictObject({
        title: text("el título del paso"),
        body: text("la descripción del paso"),
        duration: z.string().trim().optional(),
      }),
    )
    .min(3, { error: "Un método necesita al menos 3 pasos." })
    .max(8, { error: "Como máximo 8 pasos: si hay más, agrúpalos en fases." }),
});

export const gallerySchema = z.strictObject({
  type: z.literal("gallery"),
  ...base(GALLERY_VARIANTS),
  eyebrow: z.string().trim().optional(),
  title: z.string().trim().optional(),
  images: z
    .array(mediaSchema.extend({ caption: z.string().trim().optional() }))
    .min(3, { error: "Una galería necesita al menos 3 imágenes." }),
});

const cell = z.union([z.string().trim().min(1), z.boolean()], {
  error: "Cada celda es un texto o true/false.",
});

export const comparisonSchema = z
  .strictObject({
    type: z.literal("comparison"),
    ...base(COMPARISON_VARIANTS),
    eyebrow: z.string().trim().optional(),
    title: text("el título de la comparación"),
    intro: z.string().trim().optional(),
    columns: z
      .array(
        z.strictObject({
          name: text("el nombre de la columna"),
          price: z.string().trim().optional(),
          note: z.string().trim().optional(),
          /** The recommended option. At most one, and it alone gets a primary action. */
          highlight: z.boolean().default(false),
          action: linkSchema.optional(),
        }),
      )
      .min(2, { error: "Compara al menos 2 opciones." })
      .max(4, { error: "Como máximo 4 opciones: más columnas no se leen en un móvil." }),
    rows: z
      .array(z.strictObject({ label: text("la etiqueta de la fila"), values: z.array(cell) }))
      .min(1, { error: "Añade al menos una fila." }),
  })
  .superRefine((s, ctx) => {
    s.rows.forEach((row, i) => {
      if (row.values.length !== s.columns.length) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", i, "values"],
          message: `La fila "${row.label}" tiene ${row.values.length} valores y hay ${s.columns.length} columnas.`,
        });
      }
    });
    if (s.columns.filter((c) => c.highlight).length > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["columns"],
        message: "Solo una opción puede ser la recomendada (highlight).",
      });
    }
    if (s.variant === "before-after" && s.columns.length !== 2) {
      ctx.addIssue({
        code: "custom",
        path: ["columns"],
        message: 'La variante "before-after" compara exactamente 2 columnas.',
      });
    }
  });

export const testimonialsSchema = z
  .strictObject({
    type: z.literal("testimonials"),
    ...base(TESTIMONIALS_VARIANTS),
    eyebrow: z.string().trim().optional(),
    title: z.string().trim().optional(),
    quotes: z
      .array(
        z.strictObject({
          quote: text("la cita", 10),
          /** Real attribution: anonymous quotes read as invented. */
          author: text("el autor de la cita"),
          role: z.string().trim().optional(),
          figure: z.strictObject({ value: text("la cifra"), label: text("qué mide") }).optional(),
        }),
      )
      .min(1, { error: "Añade al menos un testimonio." }),
  })
  .refine((s) => s.variant !== "with-figure" || s.quotes[0]?.figure, {
    error: 'La variante "with-figure" necesita una cifra (figure) en el primer testimonio.',
    path: ["quotes", 0, "figure"],
  });

export const faqSchema = z
  .strictObject({
    type: z.literal("faq"),
    ...base(FAQ_VARIANTS),
    eyebrow: z.string().trim().optional(),
    title: text("el título de las preguntas frecuentes"),
    items: z
      .array(
        z.strictObject({
          question: text("la pregunta"),
          answer: text("la respuesta"),
          topic: z.string().trim().optional(),
        }),
      )
      .min(3, { error: "Añade al menos 3 preguntas." }),
  })
  .refine(
    (s) =>
      s.variant !== "two-column" ||
      (s.items.every((i) => i.topic) && new Set(s.items.map((i) => i.topic)).size >= 2),
    {
      error:
        'La variante "two-column" agrupa por tema: cada pregunta necesita "topic" y debe haber al menos 2 temas.',
      path: ["items"],
    },
  );

export const contactSchema = z.strictObject({
  type: z.literal("contact"),
  ...base(CONTACT_VARIANTS),
  eyebrow: z.string().trim().optional(),
  title: text("el título de contacto"),
  body: z.string().trim().optional(),
  form: z.strictObject({
    action: href,
    submitLabel: text("el texto del botón del formulario"),
    /** Optional topics for a "¿Sobre qué?" select. */
    topics: z.array(z.string().trim().min(1)).default([]),
  }),
});

export const SECTION_TYPES = [
  "hero",
  "manifesto",
  "features",
  "proof",
  "cta",
  "story",
  "method",
  "gallery",
  "comparison",
  "testimonials",
  "faq",
  "contact",
] as const;

export const sectionSchema = z.discriminatedUnion(
  "type",
  [
    heroSchema,
    manifestoSchema,
    featuresSchema,
    proofSchema,
    ctaSchema,
    storySchema,
    methodSchema,
    gallerySchema,
    comparisonSchema,
    testimonialsSchema,
    faqSchema,
    contactSchema,
  ],
  {
    error: `Tipo de sección desconocido (type). Usa uno de: ${SECTION_TYPES.map((t) => `"${t}"`).join(", ")}.`,
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
export type StorySection = z.output<typeof storySchema>;
export type MethodSection = z.output<typeof methodSchema>;
export type GallerySection = z.output<typeof gallerySchema>;
export type ComparisonSection = z.output<typeof comparisonSchema>;
export type TestimonialsSection = z.output<typeof testimonialsSchema>;
export type FaqSection = z.output<typeof faqSchema>;
export type ContactSection = z.output<typeof contactSchema>;
export type Section = z.output<typeof sectionSchema>;
export type SectionType = Section["type"];
export type Page = z.output<typeof pageSchema>;
export type PageInput = z.input<typeof pageSchema>;
export type Site = z.output<typeof siteSchema>;
export type SiteInput = z.input<typeof siteSchema>;
