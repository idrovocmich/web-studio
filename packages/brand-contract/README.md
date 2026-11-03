# @idrovocmich/brand-contract

The contract every brand must satisfy to use the [web-studio](https://github.com/idrovocmich/web-studio)
engine, written with [zod](https://zod.dev), and the function that turns a valid brand into its
final design tokens. Validation messages are in Spanish.

```bash
pnpm add @idrovocmich/brand-contract
```

## What a brand delivers (`brand.json`)

| Field        | Contents                                                                                |
| ------------ | --------------------------------------------------------------------------------------- |
| `palette`    | `primary`, `accent` (OKLCH), `neutral` (chroma + hue), optional feedback colors         |
| `typography` | `display`, `body`, optional `mono` roles, why they pair, optional fluid scale           |
| `logos`      | primary SVG, variants (at least one for dark backgrounds), minimum size, clear space    |
| `imagery`    | art direction: style, keywords, do / don't                                              |
| `voice`      | tone, description, preferred and avoided words, examples                                |
| `neverDo`    | rules the brand must never break                                                        |
| `direction`  | art direction: `density`, `contrast`, `shape`, `typePersonality`, `motion`, `signature` |

Inter, Roboto and Arial are rejected as the `display` or `body` family unless
`typography.genericFontReason` explains why.

Colors accept `{ "l": 0.52, "c": 0.13, "h": 40 }` or `"oklch(0.52 0.13 40)"`. Add
`"$schema": "./node_modules/@idrovocmich/brand-contract/dist/brand.schema.json"` for editor
autocompletion. Complete examples: [`fixtures/`](./fixtures) (fictional brands).

## Usage

```ts
import { loadBrand } from "@idrovocmich/brand-contract/node";

// Reads brand.json, validates it, checks logo/font files exist and WCAG AA contrast.
const brand = await loadBrand("./brand");
brand.css.tokens; // CSS custom properties (light + dark)
brand.css.theme; // Tailwind v4 @theme block
brand.composition; // structural decisions for sections (split, asymmetry, separators…)
brand.attributes; // data-ws-* attributes for <html>
```

## Art direction

`direction` describes the brand's character so sections change their **composition**, not just
their colors:

| Control           | Values                                            |
| ----------------- | ------------------------------------------------- |
| `density`         | `airy` · `balanced` · `dense`                     |
| `contrast`        | `soft` · `balanced` · `stark`                     |
| `shape`           | `straight` · `rounded` · `organic`                |
| `typePersonality` | `editorial` · `technical` · `warm` · `expressive` |
| `motion`          | `none` · `subtle` · `moderate` · `expressive`     |
| `signature`       | the brand's one memorable decision, in a sentence |
| `elevation`       | optional: `flat` · `soft` · `dramatic`            |

`resolveComposition(direction)` turns these into decisions such as the two-column split
(`[8, 4]` for strong asymmetry), whether a layout may break out of the grid, the heading scale,
separators, surface treatment, media crop, eyebrow style, numerals and entrance choreography.
Headings are never centered by default.

In any runtime (no file system): `validateBrand(json)` returns `{ ok, brand | issues }` and
`resolveBrand(json)` returns tokens and CSS or throws `BrandValidationError`.

```
La marca "mi-marca" no cumple el contrato (2 problemas):
  • typography.pairing: Explica en una frase por qué estas tipografías funcionan juntas (typography.pairing).
  • logos.variants: Falta una variante del logo para fondos oscuros (background "dark" o "any").
```

## Provenance

Releases are published from GitHub Actions with npm trusted publishing, so every version
carries a signed provenance statement linking it to the commit and workflow that built it.
Check the packages you installed with:

```bash
npm audit signatures
```

## License

MIT
