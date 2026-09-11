## Context

The kit's tokens live in `packages/kit/src/tokens.css` with light fallbacks, and `themes/light.css` and `themes/dark.css` reassign them under `[data-theme]`. `test/tokens.test.ts` walks component stylesheets for literal colours and checks that each theme assigns every colour token the root defines, recognising colour tokens by a name pattern. The application sets `data-theme` on the root from the store's `theme`. `SketchEditor.tsx` builds SVG with React and writes every colour as a literal attribute; `styles.css` sets the canvas background to a literal. `sketchSvgForExport` clones the live svg, strips face edges, and serialises it, so whatever the attributes hold is what the file gets. See proposal.md.

## Goals / Non-Goals

**Goals:**
- One list of canvas colours, in the kit, themed like everything else.
- The sketch component never names a colour.
- The export stays a self-contained file.

**Non-Goals:**
- Theming the three.js view; its materials are set in a different way and are a change of their own.
- Changing any colour's role or the light values.

## Decisions

**Tokens are resolved to values, not referenced from attributes.** A `usePalette()` hook in `src/ui/sketch/palette.ts` reads each `--kit-canvas-*` token with `getComputedStyle` on the root element, where the tokens cascade from, once on mount and again whenever the root's `data-theme` attribute changes, observed with a `MutationObserver`. It returns an object keyed by role. The store's theme is not the trigger: the app stamps the attribute in its own effect, which runs after a child's, so a hook keyed on the store would read the outgoing theme's values. The editor writes those values into attributes as it does today. Alternative: write `var(--kit-canvas-line)` into the attributes and let CSS resolve them. Rejected: the export serialises attributes verbatim, so a `var()` would leave the file depending on a stylesheet it does not carry, and SVG presentation attributes do not accept `var()` in every renderer.

**The token list is the palette's source of truth in one place.** `palette.ts` exports the array of role names; the hook maps each to `--kit-canvas-<role>`. A unit test reads the kit's `tokens.css` and asserts the set of `--kit-canvas-*` names equals that array, so adding a token without a reader, or a reader without a token, fails.

**Roles.** `surface`, `grid-axis`, `grid-major`, `grid-minor`, `line`, `construction`, `handle`, `select`, `hover`, `region`, `region-hover`, `region-select`, `constraint`, `anchor`, `link`, `error`, `reference`, `reference-fill`, `outline`. The preview rectangle's fill uses `region-hover`; the origin dot and handle text use `handle`; the anchor overlay keeps its own opacity attribute rather than a translucent token, because the same colour is also drawn opaque nowhere and opacity is a drawing decision, not a palette one. Region fills are translucent tokens because their light values are alphas over the surface and a dark theme needs different alphas.

**Dark values.** A dark surface a step lighter than the panel frame, grid lines a step lighter than that, geometry in the kit's dark text colour, selection and hover kept as the light blues since they must contrast with a dark ground, constraint amber and link orange lifted toward the kit's dark warning tone, anchor violet lifted one step, error the kit's dark danger, reference blues desaturated and lightened. Recorded in the theme file; the values are the kit's to tune.

**Theme test.** The colour-token name pattern in `tokens.test.ts` gains `canvas`, so both themes must assign every canvas token. The literal-colour scan is unchanged; canvas tokens are declared in `tokens.css` and the theme files, which it does not walk.

**Export.** The surface is drawn as the svg's first child, a `rect` spanning the centred viewBox in the `surface` colour, rather than styled on the element. The export is then a plain clone: the palette values are already literals in the attributes and the background travels with them.

**Inline error message.** The sketch's error popover moves its inline colour, background, and border to an `.inline-edit-error` class in `styles.css` using `--kit-danger` and `--kit-surface-raised`.

## Risks / Trade-offs

- [The hook reads computed style before the theme attribute is on the root] → The page starts light and the app stamps the saved theme in a post-mount effect, so a reload into the dark theme draws the canvas's first frame light and re-renders dark one render after the panels. Stamping the attribute synchronously from a store subscription and initialising the store's theme from storage would remove the flash; left for a follow-up.
- [A future colour added as a literal in the editor] → No test can scan JSX for hex strings without false positives; the kit's rule and this design note are the guard, and the palette object makes the right way the easy way.
- [Dark values are guesses until seen] → They are one file to tune; the e2e checks only that the values change, not what they are.
