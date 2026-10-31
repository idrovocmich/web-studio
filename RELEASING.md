# Releasing

Published packages: `@idrovocmich/tokens` and `@idrovocmich/brand-contract`.
Every other workspace package is `private` and never published.

## Normal release (after the first one)

1. In the feature pull request, run `pnpm changeset` (pick patch / minor / major and
   describe the change), then `pnpm version-packages`. Commit the version bump and
   `CHANGELOG.md`.
2. Merge the pull request into `main` once `ci` and `gitleaks` are green.
3. The `release` workflow publishes every version that is not yet on npm, with provenance,
   and pushes a git tag per package (`@idrovocmich/tokens@0.1.1`).

## One-time setup (first publication)

npm only allows a trusted publisher on a package that already exists, so the very first
version of each package is published by hand, once.

1. **npm account.** Account `idrovocmich` on npmjs.com with two-factor authentication
   enabled (Account → Two-Factor Authentication).
2. **First manual publication**, from a clean checkout of `main` on your own machine:

   ```bash
   git switch main
   git pull
   pnpm install --frozen-lockfile
   npm login
   cd packages/tokens
   pnpm pack
   npm publish idrovocmich-tokens-0.1.0.tgz --access public
   cd ../brand-contract
   pnpm pack
   npm publish idrovocmich-brand-contract-0.1.0.tgz --access public
   cd ../..
   npm logout
   ```

   `pnpm pack` builds the package and replaces `workspace:` / `catalog:` ranges with real
   versions; `npm publish` asks for your 2FA code. **`npm logout` at the end removes the
   npm session from your machine**, so no npm credential stays stored. Delete the two `.tgz`
   files afterwards.

3. **Trusted publisher**, for each of the two packages on npmjs.com
   (package → Settings → Trusted Publisher → GitHub Actions):
   - Organization or user: `idrovocmich`
   - Repository: `web-studio`
   - Workflow filename: `release.yml`
   - Environment: leave empty

   A new trusted publisher must complete its first publication within 2 days, so do steps 4–5
   right after.

4. **Enable the switch.** GitHub → repository → Settings → Secrets and variables → Actions →
   Variables → New repository variable: `NPM_PUBLISH_ENABLED` = `true`.

5. **Verify** with a patch release (step "Normal release") or by running the `release`
   workflow manually (Actions → release → Run workflow). The package page on npm should show
   a provenance badge.

6. **Lock it down.** For each package on npmjs.com: Settings → Publishing access →
   "Require two-factor authentication and disallow tokens". Trusted publishing keeps working.

## Turning publishing off

Set `NPM_PUBLISH_ENABLED` to anything other than `true` (or delete it). The workflow is
skipped on every merge until it is turned back on.
