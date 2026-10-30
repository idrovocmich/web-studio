# CLAUDE.md — web-studio

Public engine of a design system for non-generic brand websites (Astro + Netlify).
Client brands live in separate private repositories; this repo is structure only.

## Project rules

- pnpm workspaces monorepo: `packages/*` (libraries) and `apps/*` (sites).
- Strict TypeScript everywhere; no `any` without a written reason.
- Before finishing any change, run `pnpm typecheck`, `pnpm lint`, `pnpm format:check`
  and `pnpm build`.
- Package names use the `@web-studio/` scope. Shared dependency versions live in
  the `catalog:` of `pnpm-workspace.yaml`.
- Styling: Tailwind CSS v4 driven by design tokens; no hard-coded brand values in
  the engine.
- Never use `git commit --no-verify` or otherwise skip the gitleaks hook.
- Never add client names, assets, content or configuration to this repository.

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
