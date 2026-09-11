## 1. Core

- [x] 1.1 Add `SketchRect` and `SketchFeature.rects` to `types.ts`, bump the file version to 5, and validate unique handles, member directions, and single membership; verify unit tests reject a duplicate handle, a horizontal left member, a line in two rectangles, and a version 4 file presented as 5 without `rects`
- [x] 1.2 Add `rects` to the expression scope with alias resolution through member lines and the eight-name property error, and map rectangle references to member line nodes in `resolveSketch`; verify unit tests for `r1.width / 2`, `r1.right` as a u position, `r1.middle` failing with the list, and a line whose position references `r1.right` resolving after that line
- [x] 1.3 Make `migrateV3` produce version 5 with rectangle records under the original handles and no `r{k}.prop` rewrite, add `migrateV4` as a version bump with empty `rects`, and chain both in `parseDocument`; verify the migrate tests for the version 1 file, the format sample, the expression file with `r1.right + 1` kept, a version 4 file bumping, and the development file test still matching

## 2. Store

- [x] 2.1 Make `addRectangle` record the rectangle and add `explodeRectangle`, `groupRectangle` with its refusals, and `setRectSlot` with the width and height rules; make `removeLines` dissolve records; verify store tests for each, including width by expression writing `l1.at + (ply * 2)`, width refused on an expression far line, group refused for three lines and for an unattached end, and dissolve on delete

## 3. Panels

- [x] 3.1 Add `RectangleProperties` above the line form for a member line with the side marked and an Explode button, a Make rectangle button for four selected lines, and name rectangle regions by handle in the shape list; verify e2e that drawing a rectangle shows `r1 24" x 16"` in the list, selecting its right line shows the form, typing Width `20` moves the right line, typing `ply * 2` writes the expression, Explode removes the form and the list reads Region, and Make rectangle on four chained lines restores it

## 4. Docs and wrap up

- [x] 4.1 Update driven-slots (rectangle form and what Left does), expressions (rectangle names), dimensions (the form), tools-and-snapping (Rectangle tool makes a named rectangle, explode and group), planes-and-sketches, and format (version 5 and the `rects` field); verify `pnpm docs:build`
- [x] 4.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory
