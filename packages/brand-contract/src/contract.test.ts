import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BrandValidationError,
  resolveBrand,
  resolveComposition,
  validateBrand,
  type Direction,
} from "./index.js";
import { loadBrand } from "./node.js";

const fixture = (id: string): string =>
  fileURLToPath(new URL(`../fixtures/${id}`, import.meta.url));
const readFixture = async (id: string): Promise<Record<string, unknown>> =>
  JSON.parse(await readFile(`${fixture(id)}/brand.json`, "utf8")) as Record<string, unknown>;

const FIXTURES = ["casa-terracota", "voltio-labs"];

describe("fixtures", () => {
  it.each(FIXTURES)("%s satisfies the contract and passes WCAG AA", async (id) => {
    const brand = await loadBrand(fixture(id));
    expect(brand.brand.id).toBe(id);
    expect(brand.contrast.every((r) => r.pass)).toBe(true);
    expect(Object.keys(brand.assets.logos).length).toBeGreaterThanOrEqual(2);
  });

  it("produce visibly different tokens from the same engine", async () => {
    const [a, b] = await Promise.all([
      loadBrand(fixture("casa-terracota")),
      loadBrand(fixture("voltio-labs")),
    ]);
    const pick = (css: string, name: string): string | undefined =>
      new RegExp(`${name}: ([^;]+);`).exec(css)?.[1];
    for (const name of [
      "--ws-ref-color-primary-600",
      "--ws-ref-font-family-display",
      "--ws-ref-radius-md",
      "--ws-ref-duration-fast",
      "--ws-ref-space-32",
      "--ws-ref-font-leading-tight",
    ]) {
      expect(pick(a.css.tokens, name), name).not.toBe(pick(b.css.tokens, name));
    }
  });

  it("produce structurally different compositions", async () => {
    const [a, b] = await Promise.all([
      loadBrand(fixture("casa-terracota")),
      loadBrand(fixture("voltio-labs")),
    ]);
    const differences = (Object.keys(a.composition) as (keyof typeof a.composition)[]).filter(
      (key) => JSON.stringify(a.composition[key]) !== JSON.stringify(b.composition[key]),
    );
    expect(differences.length).toBeGreaterThanOrEqual(8);
    expect(a.attributes["data-ws-density"]).toBe("airy");
    expect(b.attributes["data-ws-density"]).toBe("dense");
    expect(a.attributes["data-ws-split"]).toBe("6-6");
    expect(b.attributes["data-ws-split"]).toBe("7-5");
    expect(Object.keys(a.attributes)).toHaveLength(17);
  });
});

describe("art direction", () => {
  const base: Direction = {
    density: "balanced",
    contrast: "balanced",
    shape: "rounded",
    typePersonality: "editorial",
    motion: "subtle",
    signature: "Una decisión memorable de prueba.",
  };

  it("requires the direction block with a Spanish explanation", async () => {
    const brand = await readFixture("voltio-labs");
    delete brand["direction"];
    const result = validateBrand(brand);
    expect(!result.ok && result.issues.find((i) => i.path === "direction")?.message).toContain(
      "Falta la dirección de arte",
    );
  });

  it("explains invalid control values", async () => {
    const brand = await readFixture("voltio-labs");
    const result = validateBrand({ ...brand, direction: { ...base, density: "compact" } });
    expect(!result.ok && result.issues[0]).toMatchObject({
      path: "direction.density",
      message: expect.stringContaining('"airy", "balanced", "dense"'),
    });
  });

  it("points brands still using style to direction", async () => {
    const brand = await readFixture("voltio-labs");
    const result = validateBrand({ ...brand, style: { shape: "sharp" } });
    expect(!result.ok && result.issues[0]?.message).toContain('usa "direction"');
  });

  it("never centers headings by default and always keeps the signature", () => {
    for (const typePersonality of ["editorial", "technical", "warm", "expressive"] as const) {
      const composition = resolveComposition({ ...base, typePersonality });
      expect(composition.headingAlign).not.toBe("center");
      expect(composition.signature).toBe(base.signature);
    }
    expect(resolveComposition({ ...base, motion: "none" }).reveal).toBe("none");
  });
});

describe("anti-generic rules", () => {
  it("rejects Inter, Roboto and Arial as main fonts without a reason", async () => {
    const brand = await readFixture("voltio-labs");
    const typography = brand["typography"] as Record<string, Record<string, unknown>>;
    const withBody = (family: string, reason?: string) =>
      validateBrand({
        ...brand,
        typography: {
          ...typography,
          body: { ...typography["body"], family },
          ...(reason && { genericFontReason: reason }),
        },
      });

    for (const family of ["Inter", "Roboto", "Arial", "Inter Variable"]) {
      const result = withBody(family);
      expect(!result.ok && result.issues[0]).toMatchObject({
        path: "typography.body.family",
        message: expect.stringContaining("fuente genérica"),
      });
    }
    expect(withBody("Roboto Mono").ok).toBe(true);
    expect(
      withBody("Inter", "La marca ya usa Inter en su producto y la web debe ser coherente.").ok,
    ).toBe(true);
  });
});

describe("contract errors (Spanish)", () => {
  it("lists every missing section with its path", async () => {
    const result = validateBrand({ id: "incompleta", name: "Incompleta" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const paths = result.issues.map((i) => i.path);
    expect(paths).toEqual(
      expect.arrayContaining(["palette", "typography", "logos", "imagery", "voice", "neverDo"]),
    );
    expect(result.issues.find((i) => i.path === "palette")?.message).toContain(
      "Falta la paleta base",
    );
  });

  it("explains invalid colors and accepts oklch() strings", async () => {
    const brand = await readFixture("casa-terracota");
    const bad = validateBrand({
      ...brand,
      palette: { ...(brand["palette"] as object), primary: "#ff0000" },
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.issues[0]?.message).toContain("OKLCH");

    const good = validateBrand({
      ...brand,
      palette: { ...(brand["palette"] as object), primary: "oklch(52% 0.13 40)" },
    });
    expect(good.ok && good.brand.palette.primary).toEqual({ l: 0.52, c: 0.13, h: 40 });
  });

  it("requires a logo variant for dark backgrounds", async () => {
    const brand = await readFixture("voltio-labs");
    const logos = brand["logos"] as { variants: { background: string }[] };
    const result = validateBrand({
      ...brand,
      logos: { ...logos, variants: logos.variants.map((v) => ({ ...v, background: "light" })) },
    });
    expect(!result.ok && result.issues[0]).toMatchObject({
      path: "logos.variants",
      message: expect.stringContaining("fondos oscuros"),
    });
  });

  it("flags misspelled fields", async () => {
    const brand = await readFixture("voltio-labs");
    const result = validateBrand({ ...brand, nevrDo: ["typo"] });
    expect(!result.ok && result.issues.some((i) => i.message.includes('"nevrDo"'))).toBe(true);
  });

  it("rejects palettes that fail WCAG AA with a hint", async () => {
    const brand = await readFixture("casa-terracota");
    const promise = resolveBrand({
      ...brand,
      palette: { ...(brand["palette"] as object), accent: "oklch(0.66 0.09 130)" },
    });
    await expect(promise).rejects.toBeInstanceOf(BrandValidationError);
    await expect(promise).rejects.toThrow(
      /Contraste insuficiente.*Sugerencia: ajusta la luminosidad \(l\) o el croma \(c\) de palette\.accent/s,
    );
  });

  it("reports a missing brand.json", async () => {
    await expect(loadBrand(fixture("no-existe"))).rejects.toThrow(/brand\.json.*no existe/);
  });
});
