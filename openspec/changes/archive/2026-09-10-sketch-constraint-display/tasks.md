## 1. Constraint computation

- [x] 1.1 Add the rectangle branch to the anchor lookup in `Dimensions.tsx`, mapping side and middle properties through `rectPropAsLines`; verify a unit test in `tests/ui/` that `r1.right + 1` on a line yields a drawn constraint with the same anchor coordinate as `l2.at + 1`, and that `r1.umid` anchors at the mean of the two members
- [x] 1.2 Return a `ticks` list from `dimensionsOf`, one per expression slot that is not an attachment and not on a failed line, at the run midpoint for `at` and `size` and at the end for `min` and `max`; verify unit tests for a driven position, a driven run max, an attached corner producing no tick, and a failed line producing no tick

## 2. Editor gating and drawing

- [x] 2.1 Rename the display preference from `dims` to `constraints` in the store, `persist.ts`, the debug state, and the toolbar toggle labelled "Constraints", reading a stored `dims` when `constraints` is absent; verify a unit test that a stored `{ dims: false }` loads as `constraints: false`, and update the existing e2e steps that click "Dimensions" and read `display.dims`
- [x] 2.2 Compute constraints whenever the sketch has a result and gate each through `showConstraint`: the toggle, the line hovered or selected, or the constraint selected in the list; highlight the selected constraint and, with the toggle on, those of the hovered or selected line; verify e2e that with the toggle off hovering `l1` draws its `2"` constraint and leaving hides it, that clicking the list entry draws it and keeps it, and that with the toggle on hovering `l1` highlights its constraint while `l2`'s stays drawn
- [x] 2.3 Draw a 6 px amber tick across the line for every tick whose constraint is not shown, with no pointer events; verify e2e that with the toggle off a linked position shows a tick at the midpoint, a linked run max shows a tick at that end, an attached corner shows none, and hovering the line replaces the tick with the constraint
- [x] 2.5 Carry the anchor edges on each drawn constraint and overlay a highlight on them whenever the constraint is shown by hover, selection, or the list; verify unit tests for face, line, rectangle side, and middle anchors, and e2e that hovering a face-linked line highlights the face edge and leaving clears it, that selecting a line linked to another line highlights that line, and that the toggle alone highlights nothing
- [x] 2.4 Verify e2e that placement still applies on hover: with the toggle off and a stored offset on `l1`'s constraint, hovering `l1` draws it at that offset, and that dragging, inline editing, and Delete on a hover-shown constraint behave as with the toggle on

## 3. Docs and wrap up

- [x] 3.1 Update tools-and-snapping's toggle table, rename link-tool's "Driving dimensions" section to "Constraints in the sketch" describing the toggle, hover, selection, and the tick, retitle the sketch dimensions page "Sizes and Editing" keeping its slug, and reserve "dimension" for sheets; verify `pnpm docs:build`
- [x] 3.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory
