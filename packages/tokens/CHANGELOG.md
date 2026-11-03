# @idrovocmich/tokens

## 0.4.0

### Minor Changes

- Section component tokens for `@idrovocmich/sections`: `section.bg-subtle`, `section.bg-inverse`, `section.fg-inverse`, `section.rule`, `section.rule-strong` and `section.index-color`.

## 0.3.0

### Minor Changes

- Component tokens for the `@idrovocmich/ui` and `@idrovocmich/motion` components: `heading`, `text`, `eyebrow`, `field`, `flow` (gaps, container, margins, gutters), `separator`, `frame` and `reveal`, plus new `button` (secondary, quiet, gap, focus), `card` (plain and strong border, gap), `input` (padding) and `link` (focus) tokens, and `semantic.border.heavy`. `validateTiers()` now rejects two tokens that would produce the same CSS variable (for example a component `layout.margin-compact` and the semantic `layout.margin.compact`).

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
