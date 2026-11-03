# @idrovocmich/brand-contract

## 0.2.0

### Minor Changes

- Art direction in the contract. Every brand now defines `direction` (density, contrast, shape, typePersonality, motion, signature and optional elevation); `resolveBrand()` returns `composition` (structural decisions for sections) and `attributes` (`data-ws-*` for `<html>`). Inter, Roboto and Arial are rejected as main fonts unless `typography.genericFontReason` explains why.

  **Breaking:** the optional `style` block is removed and `direction` is required. A brand that still has `style` gets a Spanish error pointing to `direction`.

### Patch Changes

- Updated dependencies
  - @idrovocmich/tokens@0.2.0

## 0.1.1

### Patch Changes

- Document how to verify npm provenance. First release published from CI with trusted publishing.
- Updated dependencies
  - @idrovocmich/tokens@0.1.1

## 0.1.0

### Minor Changes

- First release.
