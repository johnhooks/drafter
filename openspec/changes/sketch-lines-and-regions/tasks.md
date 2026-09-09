## 1. Core model and regions

- [x] 1.1 Replace `SketchRect` with `SketchLine` (`dir`, `at`, `run`, `construction`, `layout`), add `RegionRef`, the two-form `FaceRef`, `ExtrudeFeature.regions`, and `SketchFeature.regionLabels` in `types.ts`; add `lineFromPoints` and `rectangleLines` helpers in `sketch.ts`; verify `pnpm typecheck` reports only the call sites left to convert
- [x] 1.2 Change the expression scope to `lines: Map<handle, LineProps>` with direction-specific properties and the valid-property error; verify unit tests for `l1.at`, `l1.right` on a horizontal line, `l1.left` on a vertical line failing with the property list, and axis checks on a position slot
- [x] 1.3 Rewrite `resolveSketch` to order `(line, at)` and `(line, run)` nodes; verify unit tests for a rectangle of mutually attached lines resolving, a reference to a later line, a real cycle between two positions naming both, and zero-length failure
- [x] 1.4 Implement `regions.ts`: coordinate grid, walls, flood fill, strip decomposition, corner, boundary edges; verify unit tests for one rectangle, a split into two, a dangling line, unclosed lines, construction ignored, overlapping collinear lines, an L shape's area and bounds, and boundary line and direction for a shared splitting line
- [x] 1.5 Rewrite `applyExtrude` to resolve `RegionRef`s and emit one box per decomposition rectangle with per-region results; verify unit tests for the front-plane box, negative distance, an L region's volume, two adjacent regions making one body, and the errors for no regions, an opened loop, and a deleted corner line
- [x] 1.6 Rewrite `facePlaneOfExtrusion`, `resolveFaceRef`, and `findFaceRef` for region cap, base, and side-by-line faces; verify unit tests for a cap plane following a distance change, a side plane from a bounding line, a side reference failing when the line no longer bounds the region, and picking a side face point back to its line
- [x] 1.7 Update `evaluate.ts` so sketch results carry lines, regions, and errors, and `deps.ts`, `params.ts` (uses and rename over line expressions), and `names.ts` handle lines; verify the existing evaluate, params, and integration tests pass after conversion to lines

## 2. File format

- [x] 2.1 Update `validate.ts` for version 4: line shape, run two-of-three, construction, layout keys, extrude `regions` naming lines of the right direction in the sketch, face refs, `regionLabels`; verify unit tests reject a line with three run slots, an extrude with no regions, and a region ref naming a horizontal line as `vertical`
- [x] 2.2 Implement `migrateV3` per the design (lines from rectangles, size-driven positions as expressions, expression rewrite for `r{k}.prop`, extrude regions, face refs, layouts) and chain it in `parseDocument`; verify unit tests that the docs File Format sample loads as version 4 and evaluates to the same bodies as before, that `r1.right + 1` rewrites to the right line's `at`, and that a version 1 file still loads
- [x] 2.3 Add a fixture test that loads the recovered development file through `parseDocument` and compares body volumes with the version 3 evaluation; verify the test passes with the expected difference for the rectangle inside another (Extrude 2 loses the inner region) and that difference is listed in the notes with the fix to apply in the app

## 3. Store

- [x] 3.1 Rework `Selection`, `ConstraintRef`, reconciliation, and the debug hook for line ids and region refs; verify store tests that a deleted line and an unresolvable region leave the selection
- [x] 3.2 Add `addLine` with attachment, `addRectangle`, `setLineAt`, `setLineSlot`, `setConstruction`, `setRegionSize`, `toggleLine`, `toggleRegion`, `selectLines`, `selectRegions`, and re-key `setDimLayout`, `setRegionLabelLayout`, `removeConstraint`; verify store tests for a rectangle producing four attached lines, a line attaching to a perpendicular line, region width moving every right-extreme line and refusing on an expression, and construction merging regions
- [x] 3.3 Rework `removeLines` to freeze referencing slots, refuse when a slot has no value, drop region refs from extrudes, and delete emptied extrudes with dependents; rework `addExtrude` to take regions and default to all; verify store tests for deleting one side of a rectangle leaving numbers and no region, and an extrude losing its only region being removed with its face sketch
- [x] 3.4 Prune stale `regionLabels` keys in `withDoc`; verify a store test that moving a line so a region disappears drops its label placement

## 4. Sketch editor

- [x] 4.1 Render lines with hit strokes, construction styling, region fills with hover and selection tones, and error styling from last-good lines; verify e2e that three sides show no fill and the fourth side fills one region
- [x] 4.2 Implement `LineTool` with chaining, axis projection, preview, attachment, Escape and Enter; add `Line` to the toolbar and `tool()` helper; verify e2e that clicking (10, 0) and (10, 16) across a rectangle yields two regions and both endpoints attached, and a diagonal second click projects
- [x] 4.3 Rework `RectTool` to call `addRectangle` and `SelectTool` for line and region clicks, shift-click, Delete, and X; verify e2e that a line click wins over the region under it, shift-click selects two regions, and X on a splitting line merges the regions
- [x] 4.4 Rework `LinkTool` to choose lines and face edges with the parallel check and labels; verify the constraints e2e spec converted to lines passes, including the not-parallel message and `face.left + 2` written to a line position
- [x] 4.5 Rework `Dimensions.tsx` for position links, run links, tags, region width and height labels, and free-line length labels with stored and automatic placement; verify unit tests for automatic placement above a vertical line's top end and stacking, and that attachments produce no dimension
- [x] 4.6 Wire inline editing for region labels and free-line labels and dimension drags for line slots and region labels; verify the placement e2e spec converted to lines passes and a typed region width moves the right line
- [x] 4.7 Update snapping to include sketch lines and their endpoints; verify a unit test that a pointer near a vertical line snaps its u and an e2e step drawing a line that snaps onto a face edge

## 5. Panels, toolbar, timeline

- [x] 5.1 Rework `Properties.tsx`: line list with handle, direction, and error; region list synced with the view selection; line properties with direction, position, run slots with the derived one marked, construction checkbox, delete; constraint list skipping attachments; extrude panel counting regions; verify e2e that the region list selection follows a view click and the constraint list shows one entry for a linked rectangle
- [x] 5.2 Update the Extrude toolbar action to use selected regions or all, disabled with no regions, and `Timeline.tsx` to count regions; verify e2e that extruding the left then the right half of a split rectangle gives two bodies of different depth

## 6. Tests, docs, wrap up

- [x] 6.1 Convert every e2e spec and helper from rectangles and `rectIds` to lines and regions, add `lineInches` and `regionAt`; verify `pnpm test:e2e` passes
- [x] 6.2 Update docs: what-it-is, first-part, planes-and-sketches, extrude-and-bodies (regions, corner rule aside), tools-and-snapping (Line tool, construction, X, snapping to lines), dimensions (region labels, free lines), back-faces, driven-slots (line slots), expressions (line properties), link-tool, format (version 4 sample); update `AGENTS.md` where it says rectangles; verify `pnpm docs:build`
- [x] 6.3 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results, the migration check of the development file, and any overlapping-rectangle differences in a notes file in the change directory
