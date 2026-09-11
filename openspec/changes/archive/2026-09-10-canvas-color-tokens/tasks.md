## 1. Kit tokens

- [x] 1.1 Add the `--kit-canvas-*` tokens to `tokens.css` with the light values the canvas draws today, and assign them in `themes/light.css` and `themes/dark.css` with the dark values from the design; verify the kit builds and Storybook's theme switcher still renders every story
- [x] 1.2 Extend the colour-token name pattern in `test/tokens.test.ts` to include `canvas`; verify `pnpm kit:test` passes and that removing one canvas token from `dark.css` makes it fail

## 2. Palette in the sketch

- [x] 2.1 Add `src/ui/sketch/palette.ts` exporting the role list and a `usePalette(svgRef)` hook that reads each token from computed style on mount and on theme change; verify a unit test that the role list equals the set of `--kit-canvas-*` names in the kit's `tokens.css`
- [x] 2.2 Replace every colour literal in `SketchEditor.tsx` with a palette value, move the canvas background from `styles.css` to the `surface` token applied by the component, and move the inline error message's colours to an `.inline-edit-error` class on kit tokens; verify a grep of `SketchEditor.tsx` finds no `#` colour or `rgba(` and that `pnpm test:e2e` passes unchanged
- [x] 2.3 Verify e2e that with a sketch open, choosing the dark theme changes the svg background and a line's stroke to different values than in light, and choosing light restores them

## 3. Export, docs, wrap up

- [x] 3.1 Insert a full-size background rect in the resolved surface colour into the exported SVG; verify e2e that an export from the dark theme contains a rect with that fill as its first drawn element and lines in the dark line colour
- [x] 3.2 Update the ui-kit page's tokens section to name the canvas tokens and the run-it theme section to say the sketch follows the theme; verify `pnpm docs:build`
- [x] 3.3 Verify `pnpm test`, `pnpm kit:test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory
