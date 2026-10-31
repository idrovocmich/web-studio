# web-studio

Structural design system engine for non-generic brand websites, built with
[Astro](https://astro.build) and deployed on [Netlify](https://www.netlify.com).

web-studio provides the **structure** — token schema, brand contract, UI
primitives, sections, motion and content schemas — so that each brand can look
and feel like itself instead of like a template. The brands themselves never
live here.

## Architecture: public engine, private brands

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  web-studio (this repo)      │        │  brand-<client> (private)    │
│  PUBLIC                      │ ─────▶ │  PRIVATE                     │
│  - token schema              │ used   │  - token values              │
│  - brand contract (types)    │  by    │  - brand contract instance   │
│  - ui / sections / motion    │        │  - assets, copy, content     │
│  - content schemas           │        │  - site config               │
│  - starter app               │        │  - Netlify site              │
└──────────────────────────────┘        └──────────────────────────────┘
```

- **Engine (public, this repo):** generic, reusable structure. Contains no
  client names, assets, content, configuration or credentials.
- **Brands (private, one repo per brand):** consume the engine packages and
  provide everything that makes the brand unique. Each brand repo deploys its
  own Netlify site.

## Three levels of information

| Level       | What it is                                     | Where it lives                                                                                                                                   |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Secret**  | API keys, tokens, passwords, private keys      | Local environment variables, GitHub Secrets, Netlify dashboard. Never in any repo. Code only references variable **names** (see `.env.example`). |
| **Private** | Client brand assets, content and configuration | The brand's own private repository only. Never in web-studio.                                                                                    |
| **Public**  | The engine's structure                         | This repository.                                                                                                                                 |

## Repository layout

```
apps/
  starter/            Astro + Tailwind CSS v4 site driven by the active brand (Netlify-ready)
packages/
  tokens/             DTCG tokens, Style Dictionary pipeline, WCAG AA checks   → npm
  brand-contract/     Zod brand contract, brand → tokens, fictional fixtures    → npm
  ui/                 Token-driven UI primitives (not published yet)
  sections/           Composable page sections (not published yet)
  motion/             Motion primitives and presets (not published yet)
  content-schema/     Content collection schemas (not published yet)
  mcp-server/         Placeholder for the phase 4 MCP server
templates/brand-repo/ Files to copy into each private brand repository
claude-plugin/        Claude Code skills, commands, agents and hooks
tools/                Internal scripts (release)
references/           Public, non-client reference material
```

## Getting started

Requirements: Node.js 24+, pnpm 12+, and [gitleaks](https://github.com/gitleaks/gitleaks)
(the pre-commit hook blocks commits when it is missing).

```bash
pnpm install        # also enables the gitleaks pre-commit hook
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm --filter @idrovocmich/starter dev
```

### Switching the active brand

The starter reads one brand at build time. No code changes are needed:

```bash
WS_BRAND=voltio-labs pnpm --filter @idrovocmich/starter dev     # a fixture by name
WS_BRAND_DIR=../brand-acme pnpm --filter @idrovocmich/starter build  # any folder with brand.json
```

`/specimens` shows every token of the active brand in light and dark mode, the WCAG AA
contrast table, logos, imagery direction and voice. The two fixtures
(`casa-terracota`, `voltio-labs`) are fictional and exist only to prove the engine.

## Using the engine in a brand repository

Each client brand lives in its own **private** repository and installs the engine from npm:

```bash
pnpm add @idrovocmich/tokens@^0.1.0 @idrovocmich/brand-contract@^0.1.0
```

```jsonc
// package.json of a brand repository
"dependencies": {
  "@idrovocmich/brand-contract": "^0.1.0",
  "@idrovocmich/tokens": "^0.1.0"
}
```

1. Add `brand.json` at the repository root (start from a fixture in
   `packages/brand-contract/fixtures/`) plus its `logos/` and, if self-hosted, its fonts.
2. Generate the CSS at build time with `loadBrand(".")` from
   `@idrovocmich/brand-contract/node` (see `apps/starter/scripts/build-brand.ts`).
3. Copy `templates/brand-repo/.github/dependabot.yml` into the repository so Dependabot
   proposes engine updates as one grouped pull request each week.
4. Configure secrets (if any) only in the Netlify dashboard.

### Version ranges and the move to 1.0.0

The engine follows [semantic versioning](https://semver.org) with
[Changesets](https://github.com/changesets/changesets). While it is in **0.x**, npm treats the
minor number as the breaking-change number:

| Range in the brand repo | Accepts      | Meaning in 0.x                         |
| ----------------------- | ------------ | -------------------------------------- |
| `^0.1.0`                | `0.1.x` only | bug fixes only; `0.2.0` may break      |
| `~0.1.0`                | `0.1.x` only | same as `^` in 0.x                     |
| `^1.0.0` (after 1.0)    | `1.x.x`      | new features and fixes, never breaking |

So with `^0.1.0` every brand receives fixes automatically, but each `0.x` minor release
(which may change token names or the contract) must be adopted by hand. **We will release
`1.0.0` once the pilot of the first brand works in production.** From then on, `^1.0.0` lets
Dependabot deliver new features safely to all brands, and breaking changes require `2.0.0`.

## Releasing

See [RELEASING.md](./RELEASING.md). Publishing uses npm trusted publishing (OIDC) from
GitHub Actions: no npm token exists anywhere. The `release` workflow does nothing until the
repository variable `NPM_PUBLISH_ENABLED` is set to `true`.

## Security

- Every commit is scanned locally by gitleaks (`.githooks/pre-commit`) and again
  in CI (`.github/workflows/gitleaks.yml`).
- GitHub secret scanning and push protection are enabled on this repository.
- Found something sensitive? Do not open a public issue; contact the maintainer
  privately via GitHub.

## License

[MIT](./LICENSE)
