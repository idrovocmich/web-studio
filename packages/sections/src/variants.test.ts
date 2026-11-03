import type { Composition } from "@idrovocmich/brand-contract";
import { parsePage, parseSite, type Section } from "@idrovocmich/content-schema";
import { describe, expect, it } from "vitest";
import {
  comparisonVariant,
  contactVariant,
  faqVariant,
  galleryVariant,
  methodVariant,
  storyVariant,
  testimonialsVariant,
  ctaVariant,
  featuresVariant,
  footerVariant,
  headerVariant,
  heroVariant,
  manifestoVariant,
  proofVariant,
} from "./variants";

// The two fixture brands' compositions (see brand-contract fixtures).
const warm: Composition = {
  rhythm: "spacious",
  split: [6, 6],
  asymmetry: "none",
  breakout: false,
  headingScale: "modest",
  headingAlign: "start",
  separator: "curve",
  surface: "tinted",
  media: "organic",
  eyebrow: "sentence",
  numerals: "proportional-nums",
  reveal: "fade",
  signature: "Arcos",
};
const technical: Composition = {
  rhythm: "tight",
  split: [7, 5],
  asymmetry: "mild",
  breakout: true,
  headingScale: "monumental",
  headingAlign: "start",
  separator: "heavy-rule",
  surface: "outlined",
  media: "rect",
  eyebrow: "mono-caps",
  numerals: "tabular-nums",
  reveal: "choreographed",
  signature: "Cifras",
};
const editorial: Composition = {
  ...warm,
  rhythm: "regular",
  asymmetry: "strong",
  split: [8, 4],
  eyebrow: "italic",
};

const { sections } = parsePage({
  slug: "",
  title: "Inicio",
  description: "Contenido compartido por todas las marcas para comparar sus composiciones.",
  sections: [
    { type: "hero", title: "Titular", media: { alt: "Imagen" } },
    {
      type: "manifesto",
      statement: "Una frase con peso.",
      principles: ["Uno", "Dos", "Tres"],
    },
    {
      type: "features",
      title: "Rasgos",
      items: [1, 2, 3].map((n) => ({ title: `Rasgo ${n}`, body: "Descripción." })),
    },
    {
      type: "proof",
      figures: [
        { value: "1", label: "uno" },
        { value: "2", label: "dos" },
      ],
      cases: [{ title: "Caso", summary: "Resumen.", result: "Resultado." }],
    },
    {
      type: "cta",
      title: "Hablemos",
      action: { label: "Escribir", href: "mailto:hola@example.com" },
      form: { action: "/", submitLabel: "Enviar" },
    },
  ],
});
const more = parsePage({
  slug: "mas",
  title: "Más",
  description: "Las siete secciones de la segunda tanda, con contenido compartido por las marcas.",
  sections: [
    {
      type: "story",
      title: "Historia",
      chapters: [
        { title: "Uno", body: "Texto.", date: "2024" },
        { title: "Dos", body: "Texto.", date: "2025" },
      ],
    },
    {
      type: "method",
      title: "Método",
      steps: [1, 2, 3].map((n) => ({ title: `Paso ${n}`, body: "Texto." })),
    },
    { type: "gallery", images: [1, 2, 3].map((n) => ({ alt: `Imagen ${n}` })) },
    {
      type: "comparison",
      title: "Planes",
      columns: [{ name: "A" }, { name: "B", highlight: true }, { name: "C" }],
      rows: [{ label: "Fila", values: [true, true, false] }],
    },
    {
      type: "testimonials",
      quotes: [
        { quote: "Una cita de prueba.", author: "Uno", figure: { value: "3×", label: "más" } },
        { quote: "Otra cita de prueba.", author: "Dos" },
      ],
    },
    {
      type: "faq",
      title: "Preguntas",
      items: ["A", "A", "B"].map((topic, i) => ({ topic, question: `¿${i}?`, answer: "Sí." })),
    },
    { type: "contact", title: "Contacto", form: { action: "/", submitLabel: "Enviar" } },
  ],
}).sections;
const site = parseSite({ name: "Demo", locale: "es", nav: [], footer: {} });
function get<T extends Section["type"]>(type: T): Extract<Section, { type: T }> {
  const found = sections.find((s): s is Extract<Section, { type: T }> => s.type === type);
  if (!found) throw new Error(`Falta la sección ${type} en el contenido de prueba`);
  return found;
}

const variantsFor = (c: Composition): string[] => [
  heroVariant(get("hero"), c),
  manifestoVariant(get("manifesto"), c),
  featuresVariant(get("features"), c),
  proofVariant(get("proof"), c),
  ctaVariant(get("cta"), c),
  headerVariant(site, c),
  footerVariant(site, c),
];

const getMore = <T extends Section["type"]>(type: T): Extract<Section, { type: T }> => {
  const found = more.find((s): s is Extract<Section, { type: T }> => s.type === type);
  if (!found) throw new Error(`Falta la sección ${type} en el contenido de prueba`);
  return found;
};
const moreVariantsFor = (c: Composition): string[] => [
  storyVariant(getMore("story"), c),
  methodVariant(getMore("method"), c),
  galleryVariant(getMore("gallery"), c),
  comparisonVariant(getMore("comparison"), c),
  testimonialsVariant(getMore("testimonials"), c),
  faqVariant(getMore("faq"), c),
  contactVariant(getMore("contact"), c),
];

describe("auto variants", () => {
  it("also differ for every section of the second batch", () => {
    const a = moreVariantsFor(warm);
    const b = moreVariantsFor(technical);
    expect(a).toEqual([
      "interleaved",
      "steps",
      "mosaic",
      "plans",
      "conversation",
      "two-column",
      "details",
    ]);
    expect(b).toEqual(["timeline", "columns", "strip", "table", "with-figure", "index", "steps"]);
    expect(a.filter((v, i) => v === b[i])).toEqual([]);
  });

  it("give the same content a different structure per brand", () => {
    const a = variantsFor(warm);
    const b = variantsFor(technical);
    expect(a).toEqual([
      "split-media",
      "columns",
      "bento",
      "cases",
      "split-form",
      "minimal",
      "index",
    ]);
    expect(b).toEqual([
      "typographic",
      "principles",
      "index",
      "figures",
      "band",
      "technical",
      "signature",
    ]);
    expect(a.filter((v, i) => v === b[i])).toEqual([]);
  });

  it("lean editorial for strongly asymmetric brands", () => {
    expect(variantsFor(editorial).slice(0, 3)).toEqual(["editorial", "columns", "lead-list"]);
    expect(headerVariant(site, editorial)).toBe("editorial");
  });

  it("fall back when the content cannot fill a variant", () => {
    const heroWithoutMedia = { ...get("hero"), media: undefined };
    expect(heroVariant(heroWithoutMedia, warm)).toBe("editorial");
    const fewPrinciples = { ...get("manifesto"), principles: [] };
    expect(manifestoVariant(fewPrinciples, technical)).toBe("monumental");
    const noForm = { ...get("cta"), form: undefined };
    expect(ctaVariant(noForm, warm)).toBe("statement");
  });

  it("respect explicit variants", () => {
    expect(featuresVariant({ ...get("features"), variant: "bento" }, technical)).toBe("bento");
  });
});
