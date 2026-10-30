# Contributing

1. Install Node.js 24+, pnpm 12+ and gitleaks, then run `pnpm install`.
2. Create a branch from `main`.
3. Before opening a pull request, make sure these pass:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm format:check
   pnpm build
   ```
4. Keep pull requests small and focused; describe what changed and why.

## Ground rules

- **No secrets.** API keys, tokens, passwords and private keys never go into
  code, commits, logs, issues or pull requests. Only variable names may appear
  (for example in `.env.example`).
- **No client material.** Brand assets, content and configuration belong in
  each brand's private repository, never here.
- **Never bypass the hooks** (`--no-verify`). If gitleaks flags a false
  positive, raise it in the pull request instead.
