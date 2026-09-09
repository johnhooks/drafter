## 1. Preference and kit

- [x] 1.1 Replace `showDims` with a `display` preference in the store with `setDisplay`, `loadDisplay`, and `saveDisplay` in `persist.ts`; add `exprFocus` with `setExprFocus`; verify store tests for defaults, patching, and that neither changes history
- [x] 1.2 Add `ToggleIconButton` to the kit with a story and a test that Space toggles it and the tooltip names it; add the four icons to `Icon`; verify `pnpm kit:test` and `pnpm kit:build`

## 2. Editor

- [x] 2.1 Filter handle and label rendering by hover, selection, edit in progress, `exprFocus`, and the toggles, treating a hovered bounding line as hovering its regions; skip grid lines when the grid toggle is off; verify e2e that a fresh rectangle shows no handle or size label, hover shows the region's sizes, a selected line shows its handle and length, and focusing a Position field shows every handle
- [x] 2.2 Make `LenField` set and clear `exprFocus`; verify the focus step above passes and a Name field does not show handles

## 3. Toolbar, tests, docs

- [x] 3.1 Replace the Dims text toggle with the four icon toggles at the right of the sketch toolbar; verify e2e that turning sizes on shows every label, survives a reload, and turning the grid off removes the grid lines while a drawn rectangle still snaps
- [x] 3.2 Update the placement, constraints, modeler, and lines specs to hover or select before clicking a label, adding a `hoverInches` helper; verify `pnpm test:e2e`
- [x] 3.3 Update tools-and-snapping (toggle cluster, what shows by default), dimensions (hover and selection), and first-part (hover to read the size); verify `pnpm docs:build`
- [x] 3.4 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory
