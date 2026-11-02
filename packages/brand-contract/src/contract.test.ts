import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BrandValidationError, resolveBrand, validateBrand } from "./index.js";
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
    ]) {
      expect(pick(a.css.tokens, name), name).not.toBe(pick(b.css.tokens, name));
    }
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
