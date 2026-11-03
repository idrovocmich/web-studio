# @idrovocmich/content-schema

Schemas for brand content: site settings and pages made of sections. Errors are in Spanish and
name the exact field, and the schemas enforce the engine's anti-generic rules.

Status: not published yet (planned for phase 3C).

```ts
import { parsePage, parseSite } from "@idrovocmich/content-schema";

const site = parseSite(siteJson, '"src/content/site.json"');
const page = parsePage(pageJson, '"src/content/pages/inicio.json"');
```

```
El contenido "src/content/pages/inicio.json" no es válido (2 problemas):
  • sections[1].signature: Solo una sección por página puede ser la firma; ya lo es la sección 1. La audacia se concentra en una decisión.
  • sections[3].logosContext: Explica por qué importan estos logos (logosContext): un muro de logos sin contexto es genérico.
```

## Page

`slug` (empty for the home page), `title`, `description` (50–160 characters, for search
engines) and `sections`. Every section has an optional `id` (anchor), `variant` (`"auto"` by
default: the brand's art direction chooses) and `signature` (the page's one memorable decision).

| `type`         | Content                                                                                             | Variants                                  |
| -------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `hero`         | `eyebrow`, `title`, `lead`, one `action`, an optional quiet `secondary`, `media`                    | `editorial`, `typographic`, `split-media` |
| `manifesto`    | `eyebrow`, `statement`, `body[]`, `principles[]`                                                    | `monumental`, `columns`, `principles`     |
| `features`     | `eyebrow`, `title`, `intro`, 3–9 `items` (`title`, `body`, `media`)                                 | `bento`, `index`, `lead-list`             |
| `proof`        | `eyebrow`, `title`, `figures[]`, `cases[]`, `logos[]` + `logosContext`                              | `figures`, `cases`, `logos`               |
| `cta`          | `title`, `body`, one `action`, optional `form`                                                      | `statement`, `split-form`, `band`         |
| `story`        | `eyebrow`, `title`, `intro`, 2+ `chapters` (`title`, `body`, `date`, `media`)                       | `scroll`, `interleaved`, `timeline`       |
| `method`       | `eyebrow`, `title`, `intro`, 3–8 `steps` (`title`, `body`, `duration`)                              | `steps`, `columns`, `phases`              |
| `gallery`      | `eyebrow`, `title`, 3+ `images` (`alt`, `src`, `caption`)                                           | `mosaic`, `strip`, `feature`              |
| `comparison`   | `title`, 2–4 `columns` (`name`, `price`, `note`, `highlight`, `action`), `rows` (`label`, `values`) | `table`, `before-after`, `plans`          |
| `testimonials` | `eyebrow`, `title`, `quotes` (`quote`, `author`, `role`, `figure`)                                  | `single`, `conversation`, `with-figure`   |
| `faq`          | `eyebrow`, `title`, 3+ `items` (`question`, `answer`, `topic`)                                      | `accordion`, `index`, `two-column`        |
| `contact`      | `eyebrow`, `title`, `body`, `form` (`action`, `submitLabel`, `topics`); details from `site.contact` | `form-aside`, `details`, `steps`          |

`media` is `{ "alt": "…", "src": "…" }`; without `src` the section shows a placeholder described
by `alt`, so a page can be built before the photography exists.

## Site

`name`, `locale`, `nav` (up to 7 links), `header.variant`, `footer` (`variant`, `note`, `links`)
and optional `contact` (`email`, `phone`, `address`). Header variants: `minimal`, `editorial`,
`technical`; footer variants: `minimal`, `index`, `signature`.

## Rules the schema enforces

- At most **one signature section per page**.
- **One primary action per section**: a hero has one `action` and at most a quiet `secondary`
  link; a CTA has exactly one `action`. Two competing buttons cannot be written.
- Logos need `logosContext`: a wall of logos without context is generic.
- An explicit variant must be fillable: `split-media` needs `media`, `principles` needs at least
  3 principles, `split-form` needs a `form`, `figures` needs at least 2 figures, `timeline`
  needs a date per chapter, `with-figure` needs a figure in the first quote, `two-column` FAQ
  needs topics, `before-after` compares exactly 2 columns.
- Comparisons: every row has one value per column, and at most one option is `highlight` (the
  only one with a primary action).
- Every testimonial has an `author`: anonymous quotes read as invented.
- Links start with `/`, `#`, `https://`, `mailto:` or `tel:`; unknown fields are reported as
  possible typos.

Part of the public engine: it must never contain client brand data, assets or credentials.
