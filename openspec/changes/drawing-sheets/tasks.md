## 1. Projection

- [ ] 1.1 Implement `ViewFrame` definitions for front, top, left, right and the model-to-view mapping; verify tests for the box front projection and the left/right mirror scenarios
- [ ] 1.2 Implement occluder and candidate edge extraction from merged face outlines with depths; verify a test that a single box front view yields four visible outline segments and no interior segment
- [ ] 1.3 Implement exact segment-minus-intervals hidden classification, splitting, and coincident merge with visible winning; verify tests for pocket hidden, through hole visible, box behind box, and joined boxes with no join line
- [ ] 1.4 Implement collinear merge and snap target output (vertices and segments); verify tests that a pocket's hidden corners are in the vertex list and that merged segments have no redundant splits

## 2. Sheet model and rendering

- [ ] 2.1 Add sheet, dimension, and note types, defaults, auto naming, and validation, and extend the document format with an optional `sheets` list; verify tests for loading a document without sheets and for a save/load round trip with annotations
- [ ] 2.2 Implement page layout (letter, margins, orientation, title block area, drawing area) and view centring with scale, plus default-scale selection and the too-large warning; verify tests for the 1:8 default and the centred 1:4 placement scenarios
- [ ] 2.3 Implement `renderSheet` producing a paper-inch SVG with page frame, view segments (dashed hidden), and title block; verify a snapshot test and assertions on title block text and the view transform
- [ ] 2.4 Implement dimension rendering (extension lines, ticks, text placement including outside-when-small) and note rendering with leaders; verify tests for the horizontal value, small-dimension text placement, and note with leader
- [ ] 2.5 Implement detachment detection against projection vertices and segments; verify tests for a dimension that stays attached after an unrelated edit and one that detaches when its box narrows

## 3. Sheets mode UI

- [ ] 3.1 Add Sheets mode to the store and app shell with a sheet list (add, rename, reorder, delete with confirmation) and the selected sheet displayed via `renderSheet`; verify manually that Add Sheet shows a front view with a title block
- [ ] 3.2 Implement the sheet properties panel (name, orientation, view, target, scale, warnings); verify manually that changing view to Top redraws and updates the title block
- [ ] 3.3 Implement sheet navigation (zoom, pan, fit) and pointer-to-paper-to-view conversion; verify manually
- [ ] 3.4 Implement the snap candidate source from the projection and wire the shared snapper list; verify a unit test that a hidden corner is returned as a vertex snap
- [ ] 3.5 Implement the dimension tool as a three-state tool with orientation from the third click and live preview; verify manually against the place-horizontal scenario
- [ ] 3.6 Implement the note tool with inline text entry and shift-drag leader; verify manually
- [ ] 3.7 Implement select, delete, drag-move for dimension lines and notes, double-click note edit, and the annotation properties panel; verify manually against the move-dimension-line scenario

## 4. Isometric sheets

- [ ] 4.1 Implement off-screen framed rendering of the 3D view at 300 DPI for a target and cache by target and model version; verify a test that the produced image size matches the drawing area at 300 DPI
- [ ] 4.2 Embed the image in the sheet SVG, disable scale and the dimension tool for isometric sheets, and show NTS; verify manually

## 5. Print and export

- [ ] 5.1 Implement the print container, `@media print` rules, per-sheet page orientation, and Print Sheet / Print All actions; verify with print preview that pages match sheets and that a 1:4 sheet's 24" dimension measures 6" on a printed page
- [ ] 5.2 Implement SVG export of the current sheet including embedded raster for isometric; verify by opening exported files directly in a browser

## 6. Integration check

- [ ] 6.1 Draw a base cabinet carcass with a dado, make front, top, right, and isometric sheets, dimension the front and top fully, add a note with a leader, print all to PDF, then change the carcass depth and confirm sheets update and the depth dimension detaches; verify `pnpm test` and `pnpm build` pass and record the result in a notes file in the change directory
