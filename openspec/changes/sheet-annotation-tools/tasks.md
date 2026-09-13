## 1. Annotation model and rendering

- [ ] 1.1 Add dimension and note types, defaults, validation, and value computation to the sheet model and file; verify tests for the horizontal value scenario, a save and load round trip with two dimensions and a note, and that a scale change leaves values unchanged
- [ ] 1.2 Implement dimension rendering (extension lines, ticks, text placement including outside-when-small) and note rendering with leaders and arrowheads in `renderSheet`; verify tests for the small-dimension text placement and a note with leader
- [ ] 1.3 Implement detachment detection against projection vertices and segments; verify tests for a dimension that stays attached after an unrelated edit and one that detaches when its box narrows

## 2. Snapping and tools

- [ ] 2.1 Add a candidate source to the snap context and supply the projection's vertices and segments from the sheet view; verify a unit test that a hidden corner is returned as a corner snap
- [ ] 2.2 Implement the dimension tool as a three-state tool with orientation from the third position and a live preview; verify e2e that clicking two corners of a box's bottom edge and then below them places a horizontal dimension reading the box's width
- [ ] 2.3 Implement the note tool with inline text entry and shift-drag leader; verify e2e that clicking, typing, and Enter places a note, and that Escape cancels
- [ ] 2.4 Implement select, delete, drag-move for dimension lines and notes, double-click note edit, and the annotation properties panel, each edit one undo step; verify e2e that dragging a dimension line lengthens its extension lines with the value unchanged, and that Delete on a note removes it and Cmd+Z restores it
- [ ] 2.5 Add the sheet tool commands with A, D, and N in the sheet view; verify e2e that D activates the dimension tool in sheets mode and that N does nothing in a sketch

## 3. Docs and wrap up

- [ ] 3.1 Add dimensions and notes sections to the sheets docs page and the key table entries; verify `pnpm docs:build`
- [ ] 3.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory
