# @idrovocmich/sections

Page sections whose **composition is chosen from the brand's art direction**. Content (validated
by `@idrovocmich/content-schema`) says what to show; the brand's composition (from
`@idrovocmich/brand-contract`) decides how it is laid out. Two brands with the same content get
structurally different pages.

Status: not published yet (planned for phase 3C). Components ship as `.astro` source.

```astro
---
import Header from "@idrovocmich/sections/Header.astro";
import Sections from "@idrovocmich/sections/Sections.astro";
import Footer from "@idrovocmich/sections/Footer.astro";
---

<html lang="es" {...brand.attributes}>
  <Header {site} {composition} logo={{ src: "/brand/logo.svg", alt: "Marca: inicio" }} />
  <main>
    <Sections sections={page.sections} {composition} />
  </main>
  <Footer {site} {composition} />
</html>
```

## Sections and their compositions

| Section        | Variants and what they are                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Header`       | `minimal` (one quiet line) · `editorial` (masthead with numbered index) · `technical` (mono band)                |
| `Hero`         | `editorial` (asymmetric 12-column spread) · `typographic` (headline as image) · `split-media`                    |
| `Manifesto`    | `monumental` (one huge statement) · `columns` (newspaper columns) · `principles` (numbered rows)                 |
| `Features`     | `bento` · `index` (sticky table of contents + detail) · `lead-list` (one feature leads)                          |
| `Proof`        | `figures` (large numbers with sources) · `cases` (result set against the story) · `logos`                        |
| `Cta`          | `statement` (one large link) · `split-form` · `band` (inverse full-width band)                                   |
| `Story`        | `scroll` (sticky image, chapters pass by) · `interleaved` (text and images alternate) · `timeline`               |
| `Method`       | `steps` (large numerals) · `columns` (left-to-right diagram) · `phases` (native disclosure)                      |
| `Gallery`      | `mosaic` (irregular proportions) · `strip` (scroll-snap, keyboard focusable) · `feature` (one large, small rest) |
| `Comparison`   | `table` (real table, scrolls on phones) · `before-after` · `plans` (one recommended, the only primary action)    |
| `Testimonials` | `single` (one quote as a headline) · `conversation` (staggered replies) · `with-figure` (number first)           |
| `Faq`          | `accordion` (native details) · `index` (all questions, then answers) · `two-column` (by topic)                   |
| `Contact`      | `form-aside` · `details` (contact data as the headline, map as a text link) · `steps` (numbered fieldsets)       |
| `Footer`       | `minimal` · `index` (directory and contact) · `signature` (brand name set as large as possible)                  |

With `variant: "auto"` (the default) each section picks from the composition, for example:

| Composition                 | Hero          | Manifesto    | Features    | Proof     | CTA          | Header      | Footer      |
| --------------------------- | ------------- | ------------ | ----------- | --------- | ------------ | ----------- | ----------- |
| airy · soft · warm          | `split-media` | `columns`    | `bento`     | `cases`   | `split-form` | `minimal`   | `index`     |
| dense · stark · technical   | `typographic` | `principles` | `index`     | `figures` | `band`       | `technical` | `signature` |
| strongly asymmetric, italic | `editorial`   | `columns`    | `lead-list` | —         | —            | `editorial` | —           |

| Composition               | Story         | Method    | Gallery  | Comparison | Testimonials   | FAQ          | Contact   |
| ------------------------- | ------------- | --------- | -------- | ---------- | -------------- | ------------ | --------- |
| airy · soft · warm        | `interleaved` | `steps`   | `mosaic` | `plans`    | `conversation` | `two-column` | `details` |
| dense · stark · technical | `timeline`    | `columns` | `strip`  | `table`    | `with-figure`  | `index`      | `steps`   |

Pickers fall back when the content cannot fill a variant (no media, fewer than 3 principles, no
form, chapters without dates, questions without topics).

Forms, disclosures and galleries work without JavaScript: accordions and phases are native
`<details>`, the multi-step contact form is numbered fieldsets on one page, the gallery strip is
a focusable scroll region, and field ids are prefixed per section so two forms can share a page. The rules live in `variants.ts` and are covered by tests.

## Anti-generic rules

These are forbidden by default, in the engine and in every brand site. A brand may only
override one in writing, with a reason.

- **A centered hero with two buttons.** There is no centered hero, and the content schema allows
  one primary action plus at most one quiet link.
- **A grid of three identical cards.** No section lays items out as equal cards; features use a
  bento, an index or a leading item.
- **Generic purple or blue gradients.** No component draws gradients.
- **Filler icons.** There is no icon slot; an icon is only added where it carries meaning.
- **Inter, Roboto or Arial as the main font.** `brand-contract` rejects them without a reason.

**One memorable decision per page.** Mark one section with `signature: true` (the schema allows
only one). The signature section amplifies the brand's own trait instead of applying a generic
effect: monumental brands get bigger type, organic brands get bigger media, every brand gets
more room. Everything else supports it.

Part of the public engine: it must never contain client brand data, assets or credentials.
