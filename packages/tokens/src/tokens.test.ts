import { describe, expect, it } from "vitest";
import {
  buildTokens,
  checkContrast,
  contrastRatio,
  createTokens,
  cssVarName,
  generateRamp,
  oklch,
  RAMP_STEPS,
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

  it("changes output when brand options change", async () => {
    const a = await buildTokens(createTokens({ shape: "sharp", motion: "snappy" }));
    const b = await buildTokens(createTokens({ shape: "round", motion: "calm" }));
    expect(a.tokensCss).toContain("--ws-ref-radius-md: 0.125rem;");
    expect(b.tokensCss).toContain("--ws-ref-radius-md: 0.875rem;");
    expect(a.tokensCss).toContain("--ws-ref-duration-fast: 84ms;");
    expect(b.tokensCss).toContain("--ws-ref-duration-fast: 180ms;");
  });
});
