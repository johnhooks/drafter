## 1. Annotation model and rendering

- [x] 1.1 Add dimension and note types, defaults, validation, and value computation to the sheet model and file; verify tests for the horizontal value scenario, a save and load round trip with two dimensions and a note, and that a scale change leaves values unchanged
- [x] 1.2 Implement dimension rendering (extension lines, ticks, text placement including outside-when-small) and note rendering with leaders and arrowheads in `renderSheet`; verify tests for the small-dimension text placement and a note with leader
- [x] 1.3 Implement detachment detection against projection vertices and segments; verify tests for a dimension that stays attached after an unrelated edit and one that detaches when its box narrows

## 2. Snapping and tools

- [x] 2.1 Add a candidate source to the snap context and supply the projection's vertices and segments from the sheet view; verify a unit test that a hidden corner is returned as a corner snap
- [x] 2.2 Implement the dimension tool as a three-state tool with orientation from the third position and a live preview; verify e2e that clicking two corners of a box's bottom edge and then below them places a horizontal dimension reading the box's width
- [x] 2.3 Implement the note tool with inline text entry and shift-drag leader; verify e2e that clicking, typing, and Enter places a note, and that Escape cancels
- [x] 2.4 Implement select, delete, drag-move for dimension lines and notes, double-click note edit, and the annotation properties panel, each edit one undo step; verify e2e that dragging a dimension line lengthens its extension lines with the value unchanged, and that Delete on a note removes it and Cmd+Z restores it
- [x] 2.5 Add the sheet tool commands with A, D, and N in the sheet view; verify e2e that D activates the dimension tool in sheets mode and that N does nothing in a sketch

## 3. Docs and wrap up

- [x] 3.1 Add dimensions and notes sections to the sheets docs page and the key table entries; verify `pnpm docs:build`
- [x] 3.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory

## 4. Picking and placement feedback

- [x] 4.1 Restrict annotation hit targets to painted strokes and text; verify nested dimensions can be selected and dragged independently
- [x] 4.2 Highlight confirmed dimension points and incident geometry in the existing blue selection colour until completion, cancellation, or tool change; verify print/export excludes highlights
- [x] 4.3 Update documentation and rerun unit, browser, typecheck, app build, and documentation checks
