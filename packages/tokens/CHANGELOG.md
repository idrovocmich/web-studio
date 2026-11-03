# @idrovocmich/tokens

## 0.2.0

### Minor Changes

- Art direction. `createTokens()` takes `direction` (density, contrast, shape, typePersonality, motion, elevation) and `displayWeights`, which drive space rhythm, grid, type ratio, leading, tracking, measure, heading weight, radius, line strength, durations and new `semantic.motion.reveal` tokens. The primary action now always uses the exact brand color, with the text color and hover chosen for contrast.

  **Breaking:** the `shape`, `motion` and `elevation` options and the `Shape` and `MotionPersonality` types are removed; use `direction` instead. `semantic.font.weight.heading` now follows the type personality.

## 0.1.1

### Patch Changes

- Document how to verify npm provenance. First release published from CI with trusted publishing.

## 0.1.0

### Minor Changes

- First release.
