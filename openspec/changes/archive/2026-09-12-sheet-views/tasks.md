## 1. Projection

- [x] 1.1 Implement `ViewFrame` definitions for front, top, left, and right and the model-to-view mapping; verify tests for the box front projection and the left/right mirror scenarios
- [x] 1.2 Implement occluder and candidate edge extraction from merged face outlines with depths; verify a test that a single box front view yields four visible outline segments and no interior segment
- [x] 1.3 Implement exact segment-minus-intervals hidden classification, splitting, and coincident merge with visible winning; verify tests for pocket hidden, through hole visible, box behind box, and joined boxes with no join line
- [x] 1.4 Implement collinear merge and the vertex and segment lists; verify tests that a pocket's hidden corners are in the vertex list and that merged segments have no redundant splits

## 2. Sheet model and rendering

- [x] 2.1 Add sheet types, defaults, auto naming with a persisted `nextSheetNumber` counter, and validation, extend the document with an optional `sheets` list at version 6 with a version 5 migration; verify tests for loading a version 5 document without sheets, a save and load round trip with two sheets in order, and naming past deletions and reload
- [x] 2.2 Implement page layout (letter, margins, orientation, title block area, drawing area) and view centring with scale, default-scale selection, and the too-large warning; verify tests for the 1:8 default and the centred 1:4 placement scenarios
- [x] 2.3 Implement `renderSheet` producing a paper-inch SVG with page frame, solid visible and dashed hidden segments, and the title block with the 1" bar; verify a snapshot test and assertions on title block text, the view transform, and the dash on a pocket's edges
- [x] 2.4 Derive each sheet's projection from the evaluated model, memoised by sheet and model version, with the missing-target warning; verify tests that an extrude distance change updates the projection and that a deleted target yields an empty view and a warning naming the body

## 3. Sheets mode

- [x] 3.1 Add the `sheet` mode, the sheet list actions (add, rename, reorder, delete) as undoable store actions, and the `sheet` command view with the fit command available; verify unit tests for the actions and undo, and that `commandsFor` excludes model and sketch commands in sheets mode
- [x] 3.2 Add the Sheets and Model toolbar actions, the sheet list with confirm-on-delete, the sheet properties panel with warnings, and the page view with zoom, pan, and fit; verify e2e that Add Sheet shows a front view with a title block, that reordering updates the title blocks, that delete confirms and undoes, that changing the view to Top redraws and updates the title block, that Fit shows the whole page, and that 1 does nothing in sheets mode

## 4. Print, export, docs, wrap up

- [x] 4.1 Implement the print container, `@media print` rules, per-sheet page orientation, and Print Sheet and Print All actions; verify page order/orientation and the 1:4 24" to 6" scale in the generated PDF, confirm physical scale using the user's drawing, and record the result in the notes
- [x] 4.2 Implement SVG export of the current sheet; verify e2e that the download is named from the document title and sheet name, is sized in inches, and contains the title block text
- [x] 4.3 Add a drawings section to the docs with a sheets page, update the file format page for version 6 and `sheets`, the timeline page's mode list, and the key table; verify `pnpm docs:build`
- [x] 4.4 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory
