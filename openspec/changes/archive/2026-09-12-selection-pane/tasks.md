## 1. Layout

- [x] 1.1 Export a `SelectionPanel` from `Properties.tsx` that renders a kit `Panel` titled "Selection" when the selected feature is a sketch, holding the rectangle form, line form, Make rectangle, a selection count, or the empty hint, and remove those branches from `SketchProperties`; verify `pnpm typecheck`
- [x] 1.2 Render the left column in `App.tsx` as a `.props` flex column with the properties panel and the selection panel, and size them in `styles.css` so both bodies scroll independently and the pane keeps a fixed height; verify in the browser that selecting a line does not move the lists
- [x] 1.3 Move the column into `PropertiesColumn.tsx` with a focusable divider that drags and arrow-keys the pane height within the clamps, double-click resetting it, the height loaded and saved through `loadPaneHeight` and `savePaneHeight` under `drafter.layout`; verify a unit test in `tests/ui/persistDisplay.test.ts` reads a stored height and falls back to null
- [x] 1.4 Add `ScrollArea` with the `useScrollEdges` hook setting `data-more` and the CSS fades, wrapping each list and the pane content; verify by eye that the fade appears only when the content overflows
- [x] 1.5 Split the sketch panel into `SketchFields` and `SketchLists`, render the three windows in `PropertiesColumn` with a minimize control on the sketch window, and make the lists a controlled accordion with Regions open to start; verify `pnpm typecheck` and that opening Lines closes Regions

## 2. Tests and docs

- [x] 2.1 Add an e2e test in `tests/e2e/lines.spec.ts` that the Selection panel shows the hint with nothing selected, shows the line form after clicking a line, and shows `r1`'s form after choosing it in the rectangle list; verify `pnpm test:e2e`
- [x] 2.4 Add an e2e test in `tests/e2e/lines.spec.ts` that dragging the divider grows the pane by the drag distance, the arrow key shrinks it a step, the height survives a reload, double-click restores it, the open list reports `bottom` then `top` in `data-more` as it overflows and scrolls, minimizing the sketch window hides its fields and grows the lists, and opening Lines closes Regions; add an `openList` helper and use it in the tests that read a list; verify `pnpm test:e2e`
- [x] 2.2 Update the properties panel section of `docs/src/content/docs/sketch/dimensions.md` to describe the Selection pane; verify `pnpm docs:build`
- [x] 2.3 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, and `pnpm docs:build` pass and record the results in a notes file in the change directory
