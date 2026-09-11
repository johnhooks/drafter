## Why

Every colour token in the kit held its own hex value, so the same blue was written in three roles, the panel greys and the canvas greys were two unrelated ladders, and a new role had nothing to reach for by name. A primitive tier, one custom property per hue and weight, with roles pointing at primitives, defines each colour once and lets a theme say which primitive a role uses instead of restating values.

## What Changes

- `tokens.css` gains primitive colours, `--kit-color-<hue>-<weight>`, the only place a colour value is written: a grey ladder named by lightness, amber, blue, red, violet, and slate weights, and the translucent fills.
- Every role, panel and canvas alike, becomes `var()` to a primitive. The light and dark themes reassign roles to primitives and hold no values.
- The kit's token tests enforce the tiers: a colour value outside a primitive, a role or theme pointing at a primitive that does not exist, or a theme that misses a role, each fail.
- The kit's guide and the ui-kit docs page describe the two tiers.

No colour the user sees changes. The canvas error red, a hair from the panel danger red, becomes the same primitive.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. Tooling: `skip_specs`.

## Impact

- Kit: `tokens.css`, both theme files, `test/tokens.test.ts`, `AGENTS.md`.
- App: none; the sketch reads roles through computed style, which substitutes the chain.
- Docs: the ui-kit page's tokens section.
