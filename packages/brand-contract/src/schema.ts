import { z } from "zod";

const OKLCH_STRING = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i;

/** Accepts `{ l, c, h }` or a CSS string `oklch(0.6 0.15 250)` / `oklch(60% 0.15 250)`. */
export const oklchColor = z.union(
  [
    z.strictObject({
      l: z.number().min(0).max(1, { error: "La luminosidad (l) va de 0 a 1." }),
      c: z.number().min(0).max(0.4, { error: "El croma (c) va de 0 a 0.4." }),
      h: z.number().min(0).max(360, { error: "El tono (h) va de 0 a 360." }),
    }),
    z
      .string()
      .regex(OKLCH_STRING, {
        error: 'Escribe el color como "oklch(L C H)", por ejemplo "oklch(0.55 0.13 40)".',
      })
      .transform((value) => {
        const [, l = "0", percent, c = "0", h = "0"] = OKLCH_STRING.exec(value) ?? [];
        return { l: Number(l) / (percent ? 100 : 1), c: Number(c), h: Number(h) };
      }),
  ],
  {
    error:
      'Cada color se escribe en OKLCH: { "l": 0.55, "c": 0.13, "h": 40 } o "oklch(0.55 0.13 40)".',
  },
);

const nonEmpty = (what: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `Falta ${what}.` });

const fontSource = z.discriminatedUnion(
  "kind",
  [
    z.strictObject({ kind: z.literal("google") }),
    z.strictObject({
      kind: z.literal("self-hosted"),
      files: z
        .array(
          z.strictObject({
            path: z.string().regex(/\.(woff2|woff)$/i, {
              error: "Las fuentes propias deben ser .woff2 o .woff.",
            }),
            weight: z.number().int().min(100).max(900),
            style: z.enum(["normal", "italic"]).default("normal"),
          }),
        )
        .min(1, { error: "Indica al menos un archivo de fuente propia." }),
    }),
    z.strictObject({ kind: z.literal("system") }),
  ],
  { error: 'El origen de la fuente (source.kind) debe ser "google", "self-hosted" o "system".' },
);

const fontRole = (role: string) =>
  z.strictObject(
    {
      family: nonEmpty(`el nombre de la familia tipográfica para el rol "${role}"`),
      fallback: z.array(z.string().min(1)).min(1, {
        error: `Añade al menos una fuente de respaldo para "${role}", por ejemplo "serif" o "sans-serif".`,
      }),
      weights: z
        .array(z.number().int().min(100).max(900, { error: "Los pesos van de 100 a 900." }))
        .min(1, {
          error: `Indica los pesos que se usarán para "${role}", por ejemplo [400, 700].`,
        }),
      source: fontSource,
      usage: z.string().optional(),
    },
    { error: `Falta la tipografía del rol "${role}".` },
  );

const svgFile = z
  .string({ error: "Falta la ruta del archivo del logo." })
  .regex(/\.svg$/i, { error: "Los logos se entregan en SVG (la ruta debe terminar en .svg)." });

const logoVariant = z.strictObject({
  kind: z.enum(["mark", "wordmark", "horizontal", "stacked", "monochrome", "inverse"], {
    error:
      'El tipo de variante debe ser "mark", "wordmark", "horizontal", "stacked", "monochrome" o "inverse".',
  }),
  file: svgFile,
  background: z.enum(["light", "dark", "any"], {
    error: 'Indica sobre qué fondo funciona la variante: "light", "dark" o "any".',
  }),
  alt: nonEmpty("el texto alternativo (alt) de la variante del logo"),
});

/** Default UI families the engine refuses as a brand's main font without a written reason. */
export const GENERIC_FONT = /^(inter( (variable|display|tight))?|roboto( flex)?|arial( nova)?)$/i;

const choice = <const T extends readonly [string, ...string[]]>(
  values: T,
  field: string,
  meaning: string,
) =>
  z.enum(values, {
    error: `${field} define ${meaning}. Usa ${values.map((v) => `"${v}"`).join(", ")}.`,
  });

export const directionSchema = z.strictObject(
  {
    density: choice(
      ["airy", "balanced", "dense"],
      "direction.density",
      "cuánto aire rodea el contenido",
    ),
    contrast: choice(
      ["soft", "balanced", "stark"],
      "direction.contrast",
      "la distancia entre extremos (tamaños, líneas, superficies)",
    ),
    shape: choice(["straight", "rounded", "organic"], "direction.shape", "el lenguaje de formas"),
    typePersonality: choice(
      ["editorial", "technical", "warm", "expressive"],
      "direction.typePersonality",
      "la personalidad tipográfica",
    ),
    motion: choice(
      ["none", "subtle", "moderate", "expressive"],
      "direction.motion",
      "la intensidad del movimiento",
    ),
    signature: z.string().trim().min(15, {
      error:
        "Describe la decisión memorable de la marca en una frase (direction.signature), por ejemplo «titulares gigantes que se salen de la rejilla».",
    }),
    elevation: z
      .enum(["flat", "soft", "dramatic"], {
        error: 'direction.elevation debe ser "flat", "soft" o "dramatic".',
      })
      .optional(),
  },
  {
    error:
      "Falta la dirección de arte (direction): density, contrast, shape, typePersonality, motion y signature.",
  },
);

const list = (min: number, what: string) =>
  z.array(z.string().trim().min(1)).min(min, { error: `Añade al menos ${min} ${what}.` });

export const brandSchema = z.strictObject({
  $schema: z.string().optional(),
  id: z.string({ error: "Falta el id de la marca." }).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    error: 'El id solo puede tener minúsculas, números y guiones, por ejemplo "casa-terracota".',
  }),
  name: nonEmpty("el nombre de la marca"),
  description: z.string().optional(),

  palette: z.strictObject(
    {
      primary: oklchColor,
      accent: oklchColor,
      neutral: z.strictObject(
        {
          c: z
            .number()
            .min(0)
            .max(0.05, { error: "El croma de los neutros debe ser bajo (máximo 0.05)." }),
          h: z.number().min(0).max(360),
        },
        { error: 'Falta el tono de los neutros: { "c": 0.015, "h": 70 }.' },
      ),
      success: oklchColor.optional(),
      warning: oklchColor.optional(),
      danger: oklchColor.optional(),
    },
    { error: "Falta la paleta base (palette) con primary, accent y neutral." },
  ),

  typography: z
    .strictObject(
      {
        display: fontRole("display"),
        body: fontRole("body"),
        mono: fontRole("mono").optional(),
        pairing: z.string().trim().min(10, {
          error:
            "Explica en una frase por qué estas tipografías funcionan juntas (typography.pairing).",
        }),
        genericFontReason: z
          .string()
          .trim()
          .min(20, {
            error:
              "Si usas una fuente genérica como principal, explica por qué en al menos una frase (typography.genericFontReason).",
          })
          .optional(),
        scale: z
          .strictObject({
            baseMin: z.number().min(0.75).max(1.5).optional(),
            baseMax: z.number().min(0.75).max(1.75).optional(),
            ratioMin: z.number().min(1.05).max(1.5).optional(),
            ratioMax: z.number().min(1.05).max(1.618).optional(),
          })
          .optional(),
      },
      { error: "Falta la tipografía (typography) con los roles display y body." },
    )
    .superRefine((typography, ctx) => {
      if (typography.genericFontReason) return;
      for (const role of ["display", "body"] as const) {
        const family = typography[role].family;
        if (GENERIC_FONT.test(family)) {
          ctx.addIssue({
            code: "custom",
            path: [role, "family"],
            message: `"${family}" es una fuente genérica y no se acepta como fuente principal. Elige una tipografía con carácter o justifica la elección en typography.genericFontReason.`,
          });
        }
      }
    }),

  logos: z
    .strictObject(
      {
        primary: z.strictObject(
          { file: svgFile, alt: nonEmpty("el texto alternativo (alt) del logo principal") },
          { error: "Falta el logo principal (logos.primary) en SVG." },
        ),
        variants: z.array(logoVariant).min(1, { error: "Añade al menos una variante del logo." }),
        minSizePx: z
          .number()
          .int()
          .positive({ error: "El tamaño mínimo del logo debe ser un número de píxeles." }),
        clearSpace: nonEmpty("la regla de espacio de respeto del logo (clearSpace)"),
      },
      { error: "Faltan los logos (logos) de la marca." },
    )
    .refine((logos) => logos.variants.some((v) => v.background !== "light"), {
      error: 'Falta una variante del logo para fondos oscuros (background "dark" o "any").',
      path: ["variants"],
    }),

  imagery: z.strictObject(
    {
      style: z
        .string()
        .trim()
        .min(10, { error: "Describe la dirección de imagen en una o dos frases (imagery.style)." }),
      keywords: list(3, "palabras clave de imagen"),
      do: list(1, 'ejemplo de lo que sí se hace en imagen ("do")'),
      dont: list(1, 'ejemplo de lo que no se hace en imagen ("dont")'),
    },
    { error: "Falta la dirección de imagen (imagery)." },
  ),

  voice: z.strictObject(
    {
      tone: list(2, "rasgos de tono de voz"),
      description: z
        .string()
        .trim()
        .min(20, { error: "Describe la voz de la marca en al menos una frase." }),
      vocabulary: z.strictObject({
        prefer: list(1, "palabra preferida"),
        avoid: list(1, "palabra a evitar"),
      }),
      examples: z.array(z.string()).optional(),
    },
    { error: "Falta la voz de la marca (voice)." },
  ),

  neverDo: list(1, 'regla de "nunca hacer" (neverDo)'),

  direction: directionSchema,

  /** Removed in 0.2.0: kept only to explain the migration. */
  style: z
    .never({
      error:
        'El bloque "style" ya no existe: usa "direction" (density, contrast, shape, typePersonality, motion y signature).',
    })
    .optional(),
});

export type Direction = z.output<typeof directionSchema>;

/** Brand as written in `brand.json` (colors may be strings). */
export type BrandInput = z.input<typeof brandSchema>;
/** Brand after validation (colors normalised to `{ l, c, h }`). */
export type Brand = z.output<typeof brandSchema>;
