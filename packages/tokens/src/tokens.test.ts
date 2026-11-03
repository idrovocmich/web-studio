import { describe, expect, it } from "vitest";
import {
  buildTokens,
  checkContrast,
  contrastRatio,
  createTokens,
  cssVarName,
  generateRamp,
  getToken,
  headingWeight,
  oklch,
  RAMP_STEPS,
  resolveDirectionOptions,
  validateTiers,
  validateTokens,
  type TokenTree,
} from "./index.js";

describe("createTokens", () => {
  it("builds three tiers in DTCG format", () => {
    const tree = createTokens();
    expect(Object.keys(tree)).toEqual(["primitive", "semantic", "component"]);
    expect(tree.primitive["color"]).toBeDefined();
    expect(tree.semantic["color"]).toBeDefined();
    expect(tree.component["button"]).toBeDefined();
  });

  it("covers every required category", () => {
    const { primitive, semantic } = createTokens();
    for (const key of [
      "color",
      "font",
      "space",
      "radius",
      "shadow",
      "border",
      "duration",
      "easing",
      "breakpoint",
      "grid",
    ]) {
      expect(primitive[key], `primitive.${key}`).toBeDefined();
    }
    for (const key of [
      "color",
      "font",
      "text",
      "space",
      "radius",
      "shadow",
      "border",
      "motion",
      "breakpoint",
      "layout",
    ]) {
      expect(semantic[key], `semantic.${key}`).toBeDefined();
    }
  });

  it("the engine default passes tier rules and WCAG AA", () => {
    const report = validateTokens(createTokens());
    expect(report.tiers).toEqual([]);
    expect(report.contrastFailures).toEqual([]);
    expect(report.contrast.length).toBeGreaterThan(30);
  });
});

describe("tier rules", () => {
  const withComponent = (component: TokenTree["component"]): TokenTree => ({
    ...createTokens(),
    component,
  });

  it("rejects component tokens that use primitives", () => {
    const issues = validateTiers(
      withComponent({ chip: { bg: { $type: "color", $value: "{primitive.color.primary.500}" } } }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("no puede usar el token primitivo");
  });

  it("rejects literal values in component tokens", () => {
    const issues = validateTiers(
      withComponent({ chip: { bg: { $type: "color", $value: oklch(0.5, 0.1, 30) } } }),
    );
    expect(issues[0]?.message).toContain("solo pueden usar referencias");
  });

  it("rejects two tokens that would produce the same CSS variable", () => {
    const tree = createTokens();
    // component "layout.margin-compact" and semantic "layout.margin.compact" are both
    // --ws-layout-margin-compact, so the component token would reference itself.
    const issues = validateTiers({
      ...tree,
      component: {
        layout: {
          "margin-compact": { $type: "dimension", $value: "{semantic.layout.margin.compact}" },
        },
      },
    });
    expect(issues[0]?.message).toContain("misma variable CSS (--ws-layout-margin-compact)");
  });

  it("reports references to tokens that do not exist", () => {
    const issues = validateTiers(
      withComponent({ chip: { bg: { $type: "color", $value: "{semantic.color.nope}" } } }),
    );
    expect(issues[0]?.message).toContain("no existe");
  });
});

describe("color", () => {
  it("generates an 11-step ramp anchored on the exact input color", () => {
    const ramp = generateRamp({ l: 0.53, c: 0.16, h: 255 });
    expect(Object.keys(ramp.steps)).toHaveLength(RAMP_STEPS.length);
    expect(ramp.anchor).toBe(600);
    expect(ramp.steps[600].components).toEqual([0.53, 0.16, 255]);
  });

  it("keeps ramps ordered from light to dark", () => {
    const { steps } = generateRamp({ l: 0.6, c: 0.2, h: 140 }, { anchor: false });
    const lightness = RAMP_STEPS.map((s) => steps[s].components[0]);
    expect(lightness).toEqual([...lightness].sort((a, b) => b - a));
  });

  it("computes WCAG contrast", () => {
    expect(contrastRatio(oklch(1, 0, 0), oklch(0, 0, 0))).toBeCloseTo(21, 0);
    expect(contrastRatio(oklch(0.5, 0, 0), oklch(0.5, 0, 0))).toBeCloseTo(1, 5);
  });
});

describe("contrast validation", () => {
  it("checks every declared pair in light and dark mode", () => {
    const results = checkContrast(createTokens());
    expect(new Set(results.map((r) => r.mode))).toEqual(new Set(["light", "dark"]));
    expect(results.every((r) => r.pass)).toBe(true);
  });

  it("fails with a Spanish message when a palette is too light", () => {
    // L 0.57 anchors on step 600 (action.primary), where light text no longer reaches 4.5:1.
    const report = validateTokens(
      createTokens({ palette: { primary: { l: 0.57, c: 0.12, h: 90 } } }),
    );
    expect(report.ok).toBe(false);
    const failure = report.contrastFailures.find(
      (r) => r.foreground === "semantic.color.action.on-primary",
    );
    expect(failure?.message).toMatch(/^Contraste insuficiente en modo (claro|oscuro)/);
  });
});

describe("buildTokens (Style Dictionary pipeline)", () => {
  it("emits CSS variables for light mode, dark mode and forced themes", async () => {
    const { tokensCss } = await buildTokens(createTokens());
    expect(tokensCss).toContain(":root {");
    expect(tokensCss).toContain("@media (prefers-color-scheme: dark)");
    expect(tokensCss).toContain('[data-theme="dark"]');
    expect(tokensCss).toMatch(/--ws-ref-color-primary-600: oklch\(0\.53 0\.16 255\);/);
    expect(tokensCss).toContain("--ws-color-action-primary: var(--ws-ref-color-primary-600);");
    expect(tokensCss).toContain("--ws-button-bg: var(--ws-color-action-primary);");
    expect(tokensCss).not.toMatch(/\[object Object\]|undefined/);
  });

  it("writes fluid type with clamp() and composite tokens as CSS", async () => {
    const { tokensCss } = await buildTokens(createTokens());
    expect(tokensCss).toMatch(/--ws-ref-font-size-base: clamp\(1rem, .+vw, 1\.125rem\);/);
    expect(tokensCss).toMatch(/--ws-ref-easing-standard: cubic-bezier\(0\.2, 0, 0, 1\);/);
    expect(tokensCss).toMatch(/--ws-border-default: 1px solid oklch\(/);
    expect(tokensCss).toMatch(/--ws-ref-shadow-md: 0px \d+px/);
  });

  it("only overrides in dark mode the values that change", async () => {
    const { dark } = await buildTokens(createTokens());
    expect(dark.length).toBeGreaterThan(0);
    expect(dark.every((t) => t.path[0] === "semantic")).toBe(true);
  });

  it("emits a Tailwind v4 @theme block from semantic tokens", async () => {
    const { themeCss } = await buildTokens(createTokens());
    expect(themeCss).toContain("@theme inline {");
    expect(themeCss).toContain("--color-*: initial;");
    expect(themeCss).toContain("--color-action-primary: var(--ws-color-action-primary);");
    expect(themeCss).toContain("--font-display: var(--ws-font-family-display);");
    expect(themeCss).toContain("--breakpoint-md: 48rem;");
    expect(themeCss).not.toContain("--ws-ref-");
  });

  it("names primitives with a ref segment", () => {
    expect(cssVarName(["primitive", "color", "neutral", "50"])).toBe("--ws-ref-color-neutral-50");
    expect(cssVarName(["semantic", "color", "surface", "base"])).toBe("--ws-color-surface-base");
    expect(cssVarName(["component", "button", "bg"])).toBe("--ws-button-bg");
  });

  it("changes output when the art direction changes", async () => {
    const a = await buildTokens(
      createTokens({ direction: { shape: "straight", motion: "none", density: "dense" } }),
    );
    const b = await buildTokens(
      createTokens({ direction: { shape: "organic", motion: "expressive", density: "airy" } }),
    );
    expect(a.tokensCss).toContain("--ws-ref-radius-md: 0.125rem;");
    expect(b.tokensCss).toContain("--ws-ref-radius-md: 1.25rem;");
    expect(a.tokensCss).toContain("--ws-ref-duration-fast: 72ms;");
    expect(b.tokensCss).toContain("--ws-ref-duration-fast: 168ms;");
    expect(a.tokensCss).toContain("--ws-ref-space-32: 6rem;");
    expect(b.tokensCss).toContain("--ws-ref-space-32: 10.4rem;");
  });
});

const primitiveValue = (tree: TokenTree, path: string): unknown =>
  getToken(tree, `primitive.${path}`)?.$value;
const semanticRef = (tree: TokenTree, path: string): unknown =>
  getToken(tree, `semantic.${path}`)?.$value;

describe("art direction", () => {
  it("density scales section rhythm and the grid, not the small steps", () => {
    const airy = createTokens({ direction: { density: "airy" } });
    const dense = createTokens({ direction: { density: "dense" } });
    expect(primitiveValue(airy, "space.4")).toEqual(primitiveValue(dense, "space.4"));
    expect(primitiveValue(airy, "space.32")).toEqual({ value: 10.4, unit: "rem" });
    expect(primitiveValue(dense, "space.32")).toEqual({ value: 6, unit: "rem" });
    expect(primitiveValue(dense, "grid.max-width")).toEqual({ value: 88, unit: "rem" });
  });

  it("contrast sets the default type ratio and line strength", () => {
    const soft = createTokens({ direction: { contrast: "soft" } });
    const stark = createTokens({ direction: { contrast: "stark" } });
    const max = (tree: TokenTree) =>
      (getToken(tree, "primitive.font.size.5xl")?.$extensions?.["com.idrovocmich.ws"]?.fluid?.max
        .value ?? 0) as number;
    expect(max(stark)).toBeGreaterThan(max(soft) * 1.5);
    expect(semanticRef(soft, "color.line.strong")).toBe("{primitive.color.neutral.500}");
    expect(semanticRef(stark, "color.line.strong")).toBe("{primitive.color.neutral.800}");
    expect(primitiveValue(stark, "border.width.thin")).toEqual({ value: 1.5, unit: "px" });
  });

  it("type personality snaps the heading weight to the weights the brand ships", () => {
    expect(headingWeight("expressive", [400, 600])).toBe(600);
    expect(headingWeight("editorial", [300, 500])).toBe(500);
    expect(headingWeight("technical")).toBe(600);
    const tree = createTokens({
      direction: { typePersonality: "expressive" },
      displayWeights: [500, 800],
    });
    expect(primitiveValue(tree, "font.weight.display")).toBe(800);
    expect(semanticRef(tree, "font.weight.heading")).toBe("{primitive.font.weight.display}");
  });

  it("motion none removes entrance distance and stagger", () => {
    const tree = createTokens({ direction: { motion: "none" } });
    expect(primitiveValue(tree, "motion.distance")).toEqual({ value: 0, unit: "rem" });
    expect(primitiveValue(tree, "motion.stagger")).toEqual({ value: 0, unit: "ms" });
  });

  it("stark brands default to flat elevation", () => {
    expect(resolveDirectionOptions({ contrast: "stark" }).elevation).toBe("flat");
    expect(resolveDirectionOptions({ contrast: "stark", elevation: "dramatic" }).elevation).toBe(
      "dramatic",
    );
  });

  it("every direction combination passes tier rules and WCAG AA", () => {
    for (const density of ["airy", "dense"] as const)
      for (const contrast of ["soft", "balanced", "stark"] as const)
        for (const shape of ["straight", "organic"] as const)
          for (const typePersonality of ["editorial", "technical", "warm", "expressive"] as const) {
            const report = validateTokens(
              createTokens({ direction: { density, contrast, shape, typePersonality } }),
            );
            expect(report.ok, `${density}/${contrast}/${shape}/${typePersonality}`).toBe(true);
          }
  });
});

describe("exact brand color", () => {
  it("the primary action uses the exact brand color, wherever it lands in the ramp", () => {
    for (const [l, step] of [
      [0.45, 700],
      [0.53, 600],
      [0.29, 900],
    ] as const) {
      const tree = createTokens({ palette: { primary: { l, c: 0.08, h: 30 } } });
      expect(semanticRef(tree, "color.action.primary")).toBe(`{primitive.color.primary.${step}}`);
      expect(primitiveValue(tree, `color.primary.${step}`)).toEqual(oklch(l, 0.08, 30));
      expect(validateTokens(tree).ok, `l=${l}`).toBe(true);
    }
  });

  it("puts dark text on light brand colors and moves hover away from the text", () => {
    const tree = createTokens({ palette: { primary: { l: 0.45, c: 0.12, h: 30 } } });
    expect(semanticRef(tree, "color.action.on-primary")).toBe("{primitive.color.neutral.50}");
    expect(semanticRef(tree, "color.action.primary-hover")).toBe("{primitive.color.primary.800}");
  });

  it("rejects a brand color too light for the page background", () => {
    const report = validateTokens(
      createTokens({ palette: { primary: { l: 0.85, c: 0.1, h: 30 } } }),
    );
    expect(report.contrastFailures.map((r) => r.foreground)).toContain(
      "semantic.color.action.primary",
    );
  });
});
