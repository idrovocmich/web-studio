import type { Composition } from "@idrovocmich/brand-contract";
import { parsePage, parseSite, type Section } from "@idrovocmich/content-schema";
import { describe, expect, it } from "vitest";
import {
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

describe("auto variants", () => {
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
