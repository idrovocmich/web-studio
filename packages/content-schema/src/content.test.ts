import { describe, expect, it } from "vitest";
import { ContentValidationError, parsePage, validatePage, validateSite } from "./index.js";

const hero = { type: "hero", title: "Un titular", action: { label: "Empezar", href: "/empezar" } };
const page = (sections: unknown[]) => ({
  slug: "",
  title: "Inicio",
  description: "Una descripción de prueba con la longitud suficiente para el buscador.",
  sections,
});

describe("pages", () => {
  it("accepts a valid page and defaults variants to auto", () => {
    const result = validatePage(page([hero]));
    expect(result.ok && result.data.sections[0]).toMatchObject({
      variant: "auto",
      signature: false,
    });
  });

  it("allows only one signature section per page", () => {
    const result = validatePage(
      page([
        { ...hero, signature: true },
        { ...hero, signature: true },
      ]),
    );
    expect(!result.ok && result.issues[0]).toMatchObject({
      path: "sections[1].signature",
      message: expect.stringContaining("Solo una sección por página puede ser la firma"),
    });
  });

  it("has no way to write a hero with two primary buttons", () => {
    const result = validatePage(page([{ ...hero, actions: [hero.action, hero.action] }]));
    expect(!result.ok && result.issues[0]?.message).toContain('"actions"');
  });

  it("rejects a wall of logos without context", () => {
    const proof = {
      type: "proof",
      logos: [{ name: "Uno" }, { name: "Dos" }, { name: "Tres" }],
    };
    const result = validatePage(page([proof]));
    expect(!result.ok && result.issues[0]).toMatchObject({
      path: "sections[0].logosContext",
      message: expect.stringContaining("un muro de logos sin contexto es genérico"),
    });
  });

  it("checks that an explicit variant can be filled by the content", () => {
    const result = validatePage(
      page([{ type: "manifesto", variant: "principles", statement: "Una frase con peso." }]),
    );
    expect(!result.ok && result.issues[0]?.message).toContain("al menos 3 principios");
    const split = validatePage(page([{ ...hero, variant: "split-media" }]));
    expect(!split.ok && split.issues[0]?.path).toBe("sections[0].media");
  });

  it("explains unknown section types, bad links and SEO descriptions in Spanish", () => {
    const result = validatePage({
      ...page([{ type: "carousel" }, { ...hero, action: { label: "Ir", href: "ir" } }]),
      description: "Corta",
    });
    const messages = !result.ok ? result.issues.map((i) => `${i.path}: ${i.message}`) : [];
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining("description: La descripción debe tener entre 50 y 160"),
        expect.stringContaining("sections[0].type: Tipo de sección desconocido"),
        expect.stringContaining('sections[1].action.href: El enlace debe empezar por "/"'),
      ]),
    );
  });

  it("throws a readable error naming the file", () => {
    expect(() => parsePage(page([]), '"pages/inicio.json"')).toThrow(ContentValidationError);
    expect(() => parsePage(page([]), '"pages/inicio.json"')).toThrow(
      /El contenido "pages\/inicio.json" no es válido \(1 problema\)/,
    );
  });
});

describe("site", () => {
  it("validates navigation and contact details", () => {
    const result = validateSite({
      name: "Demo",
      locale: "es",
      nav: [{ label: "Inicio", href: "/" }],
      footer: {},
      contact: { email: "no-es-un-correo" },
    });
    expect(!result.ok && result.issues[0]?.message).toBe("El correo de contacto no es válido.");
  });
});
