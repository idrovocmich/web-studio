# CLAUDE.md — web-studio

Public engine of a design system for non-generic brand websites (Astro + Netlify).
Client brands live in separate private repositories; this repo is structure only.

## Project rules

- pnpm workspaces monorepo: `packages/*` (libraries) and `apps/*` (sites).
- Strict TypeScript everywhere; no `any` without a written reason.
- Before finishing any change, run `pnpm typecheck`, `pnpm lint`, `pnpm format:check`,
  `pnpm test` and `pnpm build`.
- Package names use the `@idrovocmich/` scope. Shared dependency versions live in
  the `catalog:` of `pnpm-workspace.yaml`.
- Styling: Tailwind CSS v4 driven by design tokens; no hard-coded brand values in
  the engine.
- Never use `git commit --no-verify` or otherwise skip the gitleaks hook.
- Never add client names, assets, content or configuration to this repository.
- `main` is protected: every change goes through a pull request with green `ci` and
  `gitleaks` checks.

## Tokens and brands

- Tokens are W3C DTCG in three tiers: primitive → semantic → component. Component
  tokens may only reference semantic tokens; `validateTiers()` enforces it.
- Every foreground color declares the backgrounds it must pass WCAG AA against
  (`$extensions["com.idrovocmich.ws"].contrast`). Never lower a minimum to make a brand pass.
- Brand fixtures in `packages/brand-contract/fixtures/` must be clearly fictional.
- Contract error messages are written in Spanish.

## Versioning and publishing

- Only `@idrovocmich/tokens` and `@idrovocmich/brand-contract` are published.
- A change to a published package needs a changeset and the version bump in the same
  pull request (`pnpm changeset` then `pnpm version-packages`).
- Never run `npm publish` or `pnpm publish`, and never create or ask for npm tokens:
  publishing happens only in `.github/workflows/release.yml` via trusted publishing.

## REGLA PERMANENTE DE SEGURIDAD

- Secreto (API keys, tokens, contraseñas, llaves): nunca en ningún repo, ni en
  código, ni en commits, ni en logs, ni en mensajes. Solo variables de entorno
  locales, GitHub Secrets o el panel de Netlify. En el código solo se escriben
  los nombres de las variables, por ejemplo en .env.example.
- Privado (activos, contenido y configuración de marcas de clientes): solo en
  repos privados de cada marca. Nunca en web-studio.
- Público: únicamente la estructura del motor.
- Si necesitas una credencial, pídeme que la configure yo directamente; nunca
  me pidas que la pegue en el chat.

## Credenciales y publicación

- Las API keys y tokens solo viven en archivos `.env` locales (ignorados por git),
  en GitHub Secrets o en el panel de Netlify.
- El código solo lee variables de entorno (`process.env.NOMBRE`,
  `import.meta.env.NOMBRE`) y nunca contiene valores. Cada variable nueva se
  documenta por nombre en `.env.example`, sin valor.
- La publicación en npm usa trusted publishing (OIDC desde GitHub Actions), sin
  tokens de npm guardados en ningún sitio.
