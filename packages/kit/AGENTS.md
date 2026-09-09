# @bitmachina/drafter-kit

The component library the application's panels are built from. React Aria Components supply behaviour, accessibility, focus, and keyboard handling; every visual decision is ours and comes from one set of tokens.

## The look

Flat, dense, quiet. Panels a step lighter than the frame, controls a step lighter than panels; one-pixel lines a step darker than the surface they sit on; no shadows, gradients, or borders on hover. Text 11 px in the system font, 12 px for field values, 10 px upper-case letter-spaced section labels. Row height 20 px, control height 24 px, spacing in multiples of 4 px, radius 2 px. One accent colour, used only for selection and the active tool, with dark text on it. Focus is a one-pixel accent outline for keyboard focus only. If a control draws attention to itself at rest, it is wrong.

## Rules

- Style only through `--kit-*` tokens and React Aria data attributes (`[data-hovered]`, `[data-pressed]`, `[data-selected]`, `[data-focus-visible]`, `[data-disabled]`). A test fails on any literal colour in a component stylesheet.
- Tokens are semantic, named for their role, declared in `src/tokens.css` with the light values as fallback. A theme is one rule under `[data-theme="name"]` in `src/themes/`. A test fails if a theme misses a colour token the root defines. Components never know which theme is active.
- Every component is `src/components/Name/{Name.tsx,Name.css,Name.stories.tsx,Name.test.tsx}`, exported from `src/index.ts`: a story per meaningful state, a test for the keyboard behaviour.
- Base styles in `base.css` use `:where()` so component classes always win.
- Icons come from Lucide at 14 px, or the kit's own 12 px glyphs for the smallest cells; nothing outside the kit imports an icon library. An icon-only control is always an `IconButton` with an `aria-label`, which is also its tooltip. Text never stands in for an icon.
- The kit knows nothing about the application's domain: no inches, no parsing. Fields take `validate` and `onCommit` so the caller decides what is valid.

## Idioms the application relies on

- **Fields commit on Enter or blur and revert on Escape.** Live-typing inputs are the exception, used only where a button must enable from unfinished text.
- **View state is a cluster of icon toggles**, always visible at the edge of a toolbar, each on or off with a tooltip, never a menu of checkboxes. Menus hold actions, not state.
- **Rows show their actions on hover**, in a reserved gutter (`actionSlots`) so the detail text does not shift when they appear.
- **ListBox rows carry a detail slot** for secondary text and a tone for error rows. Selection is the accent fill.
- **Dialogs ask; toasts tell.** Refusals and warnings are toasts that stay until dismissed; confirmations are `ConfirmDialog` with the destructive action named on its button.

## Commands

```shell
pnpm kit:storybook   # components at http://localhost:6006, theme switcher in the toolbar
pnpm kit:test        # Vitest and Testing Library, including the token tests
pnpm kit:build       # static Storybook; the check that every story renders
```
