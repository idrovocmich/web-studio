# Changesets

Every pull request that changes a published package (`@idrovocmich/tokens`,
`@idrovocmich/brand-contract`) records its change here and bumps the version in
the same pull request:

```bash
pnpm changeset           # describe the change and pick patch / minor / major
pnpm version-packages    # apply it: bumps package.json and writes CHANGELOG.md
```

Commit both results. When the pull request is merged into `main`, the `release`
workflow publishes every version that is not on npm yet (only while the
repository variable `NPM_PUBLISH_ENABLED` is `true`).

While the engine is in `0.x`, breaking changes are `minor` bumps and everything
else is `patch`. See the root README for the move to `1.0.0`.
