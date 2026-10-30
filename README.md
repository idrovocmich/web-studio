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
  starter/            Astro + Tailwind CSS v4 + strict TypeScript reference site (Netlify-ready)
packages/
  tokens/             Design token schema and CSS custom-property output
  brand-contract/     Typed contract every brand repo must satisfy
  ui/                 Token-driven UI primitives
  sections/           Composable page sections
  motion/             Motion primitives and presets
  content-schema/     Content collection schemas
claude-plugin/        Claude Code skills, commands, agents and hooks
tools/                Internal scripts and CLIs
references/           Public, non-client reference material
```

## Getting started

Requirements: Node.js 24+, pnpm 12+, and [gitleaks](https://github.com/gitleaks/gitleaks)
(the pre-commit hook blocks commits when it is missing).

```bash
pnpm install        # also enables the gitleaks pre-commit hook
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @web-studio/starter dev
```

## Security

- Every commit is scanned locally by gitleaks (`.githooks/pre-commit`) and again
  in CI (`.github/workflows/gitleaks.yml`).
- GitHub secret scanning and push protection are enabled on this repository.
- Found something sensitive? Do not open a public issue; contact the maintainer
  privately via GitHub.

## License

[MIT](./LICENSE)
