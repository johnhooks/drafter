## 1. Model

- [ ] 1.1 Add `layout` to `SketchRect` with validation (whole sixteenths offset, label fraction in range), and drop it in `removeConstraint`; verify tests for validation and that removing a constraint clears its layout
- [ ] 1.2 Add the `setDimLayout` store action; verify a test that it stores the layout and grows the undo stack

## 2. Rendering

- [ ] 2.1 Make `dimensionsOf` and the size labels read placements, with the new defaults (opposite side, stacking) and the sign convention; verify unit tests on `dimensionsOf` for default side, stacking, stored offset, negative offset, and label fraction
- [ ] 2.2 Draw labels at their fraction, including beyond the ends; verify an e2e that a label placed at fraction 1 sits at the driven edge

## 3. Dragging

- [ ] 3.1 Add drag state to `SelectTool` with the 3 px threshold, line drag perpendicular with sixteenth snapping and side flipping, and label drag along the line; move label editing to pointerup-without-move; verify e2e for drag line, drag across to flip, drag label, and click still selects and edits
- [ ] 3.2 Verify e2e that a drag is one undo step and that placement survives a reload

## 4. Docs and wrap up

- [ ] 4.1 Update the Link tool page (driving dimensions section) and the Dimensions page for dragging and the default side; verify `pnpm docs:build`
- [ ] 4.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm build` pass and record results in a notes file in the change directory
