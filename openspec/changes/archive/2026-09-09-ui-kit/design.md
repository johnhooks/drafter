## Context

The application is React 19 with plain CSS in `src/ui/styles.css`. Panels use bare `button`, `input`, and `select` elements and `window.confirm`. Drawing surfaces (the SVG sketch editor and the three.js view) are custom and stay custom. The repo is a pnpm workspace already holding `docs/`.

## Goals / Non-Goals

**Goals:**
- Accessible, keyboard-complete controls without writing focus management by hand.
- A look that stays consistent because every colour, size, and spacing comes from one token file.
- Every component viewable and testable in isolation.

**Non-Goals:**
- User-defined themes or a theme editor. Themes are files in the kit.
- Replacing the drawing surfaces.
- A public npm package. The kit is internal to this repository.

## Decisions

**React Aria Components as the foundation.** It supplies behaviour, ARIA, focus, and keyboard handling for every control we need and exposes state as data attributes (`data-hovered`, `data-selected`, `data-focus-visible`, `data-disabled`) that plain CSS can style. Alternatives: the fully styled React Spectrum (its look and Provider are not ours to change, and it is heavy), a headless library such as Radix (comparable, but React Aria's collection components, ListBox and Menu in particular, are stronger and its field components model labels, descriptions, and errors the way our properties panel needs).

**Plain CSS with semantic tokens, one stylesheet per component.** Components style only through custom properties under a `--kit-` prefix and React Aria data attributes. The tokens are semantic, named for their role rather than their value: `--kit-surface-frame`, `--kit-surface-panel`, `--kit-surface-control`, `--kit-surface-raised`, `--kit-line`, `--kit-line-strong`, `--kit-text`, `--kit-text-muted`, `--kit-accent`, `--kit-on-accent`, `--kit-danger`, `--kit-warning`, `--kit-focus`, plus non-colour tokens for the type scale, a 4 px spacing unit, a 2 px radius, and control and row heights. Alternatives: Tailwind (a second vocabulary to keep consistent with the tokens), CSS modules (unnecessary; class names are prefixed `kit-`).

**Themes assign tokens; components never know which theme is active.** `src/themes/light.css` and `src/themes/dark.css` each contain one rule, `[data-theme="light"] { ... }` and `[data-theme="dark"] { ... }`, assigning every colour token. `tokens.css` declares the non-colour tokens on `:root` and the light values as the fallback when no attribute is set. A consumer sets `data-theme` on the root element or on any subtree, so a dark panel inside a light app is possible. A `ThemeProvider` component sets the attribute and exposes `useTheme()` for a switcher; it is a convenience, not a requirement. Storybook gets a global toolbar control that sets the attribute on the preview, so every story is reviewed in both themes. A test checks that both theme files assign the same token set, so a theme cannot silently miss one.

**The look.** The light theme is flat surfaces in mid grey, panels a step lighter than the frame, controls a step lighter than panels. The dark theme keeps the same relationships with the steps reversed. Lines are one pixel and one step darker than the surface they sit on; there are no shadows, gradients, or borders on hover. Text is 11 px in the system UI font, 12 px for field values, upper-case 10 px letter-spaced labels for section headers. Selection and the active tool use the accent colour as a fill with dark text, the only saturated colour on screen. Row height 20 px, control height 24 px, spacing in multiples of 4 px. Focus is a one-pixel accent outline, visible only for keyboard focus.

**Component set and where each is used.**
- Button, ToggleButton, ToggleButtonGroup, Toolbar: the top bar and the sketch tools.
- TextField: names and expressions. NumberField: none of the length fields, since lengths are parsed by the app's own parser; it exists for plain numbers such as zoom.
- Select: operation, target body, plane.
- Checkbox: flip normal, show dimensions.
- ListBox: the timeline and the rectangle and constraint lists, with a secondary text slot and a trailing actions slot.
- Menu: the New sketch dropdown.
- Dialog: confirmations replacing `window.confirm`.
- Toast: notices.
- Tooltip: button hints.
- Disclosure: collapsible property sections.
- Panel, Field, Row: layout primitives so panels compose without ad hoc CSS.

**Length parsing stays in the app.** The kit's TextField takes `validate` and `onCommit` props so the app can plug in `parseLen`; the kit does not know about inches.

**Storybook 9 with the react-vite framework** inside the package. A Foundations story renders the tokens (colour swatches, type scale, spacing) so the theme can be reviewed as a whole. Each component has a story per meaningful state. The accessibility addon runs on every story. `storybook build` is the verification for the stories.

**Tests with Vitest, jsdom, and Testing Library** in the package: keyboard behaviour (arrow keys in a ToggleButtonGroup, Escape closing a Dialog, typing in a ListBox), commit and validation in TextField, and that every component renders its tokens rather than literal colours (a test greps the CSS for hex values outside `tokens.css`).

**Package layout.**
```
packages/kit/
  package.json           @drawing/kit, exports ./src/index.ts, styles ./src/tokens.css
  .storybook/{main,preview}.ts
  src/tokens.css          non-colour tokens and light fallbacks
  src/base.css
  src/themes/{light,dark}.css
  src/theme/{ThemeProvider.tsx,useTheme.ts}
  src/index.ts
  src/components/<Name>/{Name.tsx,Name.css,Name.stories.tsx,Name.test.tsx}
  src/foundations/Tokens.stories.tsx
```

## Risks / Trade-offs

- [Two styling systems in the repo until the app migrates] → The kit's tokens are also imported by the app's stylesheet in this change so the app's greys and accent match, even before components move.
- [React Aria's CSS reset expectations differ from the app's] → The kit ships `tokens.css` and `base.css` (box-sizing, font) and documents that consumers import both.
- [Storybook adds a large dev dependency] → Confined to the package; the app's dev server and build do not load it.
- [The 11 px density reads small on high-density displays] → Sizes are tokens; a one-line change scales them.
- [A theme drifts from the token set as tokens are added] → The token-parity test fails the build when a theme misses a token.
