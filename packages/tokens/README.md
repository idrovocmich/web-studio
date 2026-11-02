# @idrovocmich/tokens

Three-tier design tokens in the [W3C DTCG](https://www.designtokens.org/tr/drafts/format/)
format, a [Style Dictionary](https://styledictionary.com) pipeline that emits CSS custom
properties and a Tailwind CSS v4 `@theme` block, and automatic WCAG AA contrast checks.
Part of [web-studio](https://github.com/idrovocmich/web-studio).

```bash
pnpm add @idrovocmich/tokens
```

## Tiers

| Tier          | CSS name             | May reference         | Example                      |
| ------------- | -------------------- | --------------------- | ---------------------------- |
| **primitive** | `--ws-ref-*`         | primitives            | `--ws-ref-color-primary-600` |
| **semantic**  | `--ws-*`             | primitives, semantics | `--ws-color-action-primary`  |
| **component** | `--ws-<component>-*` | **semantics only**    | `--ws-button-bg`             |

The rules are enforced by `validateTiers()`; the build fails if a component token uses a
primitive or a literal value.

Categories: color (OKLCH, light and dark mode), typography (families, weights, fluid
`clamp()` scale, leading, tracking), spacing, radius, shadow, border, motion (durations and
cubic-bezier curves), breakpoints and grid.

## Use the default CSS

```css
@import "tailwindcss";
@import "@idrovocmich/tokens/tokens.css";
@import "@idrovocmich/tokens/theme.css";
```

`theme.css` resets Tailwind's default palette, fonts, radii, shadows and breakpoints, so only
token-backed utilities exist: `bg-surface-base`, `text-content-primary`, `rounded-control`,
`font-display`, `text-h1`, `shadow-raised`, `ease-standard`, `p-md`…

Dark mode follows `prefers-color-scheme`; force it with `data-theme="dark"` or
`data-theme="light"` on any element.

## Generate tokens for a brand

```ts
import { buildTokens, createTokens, formatReport, validateTokens } from "@idrovocmich/tokens";

const tree = createTokens({
  palette: { primary: { l: 0.52, c: 0.13, h: 40 }, neutral: { c: 0.018, h: 70 } },
  fonts: { display: ["Fraunces", "serif"] },
  shape: "round", // sharp | soft | round
  motion: "calm", // calm | balanced | snappy
  elevation: "soft", // flat | soft | dramatic
});

const report = validateTokens(tree); // tier rules + WCAG AA in light and dark mode
if (!report.ok) throw new Error(formatReport(report));

const { tokensCss, themeCss } = await buildTokens(tree);
```

Brands normally go through `@idrovocmich/brand-contract`, which validates the full brand and
calls these functions.

## Contrast

Foreground tokens declare the backgrounds they must be legible against in
`$extensions["com.idrovocmich.ws"].contrast`. Every pair is measured in both modes against
WCAG 2 AA: 4.5:1 for text, 3:1 for large text and UI elements.

## License

MIT
