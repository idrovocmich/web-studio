# @idrovocmich/ui

Astro components built on component tokens whose **composition follows the brand's art
direction**. The brand's `data-ws-*` attributes on `<html>` (from
`@idrovocmich/brand-contract`'s `resolveBrand().attributes`) decide splits, asymmetry, surfaces,
media crops, separators, heading scale and eyebrow style, so the same markup produces different
structures for different brands.

Status: not published yet (planned for phase 3C). Components ship as `.astro` source.

```astro
---
import Split from "@idrovocmich/ui/Split.astro";
import Heading from "@idrovocmich/ui/Heading.astro";
---

<html lang="es" {...brand.attributes}>
  <Split>
    <Heading level={1} size="display">
      …
    </Heading>
    <Figure ratio="4/5" />
  </Split>
</html>
```

## Components

| Component   | Follows the composition                                                         |
| ----------- | ------------------------------------------------------------------------------- |
| `Container` | width from density; is a size container so headings fit their column            |
| `Stack`     | vertical flow with token gaps                                                   |
| `Cluster`   | wrapping row with token gaps                                                    |
| `Split`     | `ratio="brand"` → 6/6, 7/5 or 8/4 (`data-ws-split`); `reverse`                  |
| `Grid`      | `lead` (default), `bento`, `staggered`; `even` only for lists                   |
| `Bleed`     | reaches the viewport edge when `data-ws-breakout="true"` (or `force`)           |
| `Frame`     | crop from `data-ws-media`: rect, rounded or organic (arch); placeholder         |
| `Figure`    | `Frame` + caption                                                               |
| `Separator` | `data-ws-separator`: space, rule, heavy rule or curve                           |
| `Heading`   | modest / large / monumental display; offset one column for strong asymmetry     |
| `Text`      | lead, body, small, caption; reading measure; numerals from `data-ws-numerals`   |
| `Eyebrow`   | mono caps, italic, caps or sentence case (`data-ws-eyebrow`)                    |
| `Button`    | primary, secondary, quiet; `<a>` with `href`, `<button>` otherwise; 44px target |
| `Link`      | underline, focus ring; `external` adds `rel` and an announced label             |
| `Card`      | `surface="brand"` → tinted, raised or outlined (`data-ws-surface`)              |
| `Field`     | label, hint, error wired with `aria-describedby` / `aria-invalid`; select, area |
| `Logo`      | light and dark variants, switched by color scheme or `data-theme`               |

All components use only component tokens (`--ws-<component>-*`), meet WCAG 2.2 AA (visible
focus, 24px+ targets, labelled controls) and have no runtime dependencies. Pages that use
`Bleed` should set `html { overflow-x: clip }`, because `100vw` includes the scrollbar.

## Anti-generic defaults

- Headings are never centered by default.
- `Grid` defaults to `lead` (one item leads, the rest follow), not equal columns.
- There is no icon component: an icon must carry meaning, so it is added where it does.
- No gradients anywhere in the components.

Part of the public engine: it must never contain client brand data, assets or credentials.
