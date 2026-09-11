## Context

A sketch is `lines: SketchLine[]`; the Rectangle tool calls `addRectangle`, which allocates four handles and adds four attached lines with no record of their origin. The expression scope has `lines` and `face`; `resolveSketch` orders `(line, at)` and `(line, run)` nodes. The shape list guesses "Rectangle" from a region's decomposition. `migrateV3` rewrites `r{k}.prop` to line expressions. See proposal.md.

## Goals / Non-Goals

**Goals:**
- A rectangle record that adds a name and a form and changes nothing about how the lines resolve or how regions are found.
- Old expressions and old handles survive migration.

**Non-Goals:**
- A rectangle as an extrude input or a selection kind of its own.
- Translating a rectangle as a unit.

## Decisions

**Record on the sketch, file version 5.** `SketchFeature.rects: SketchRect[]` with `SketchRect = { id, handle, lines: readonly [left, bottom, right, top] }` holding line ids. The version bumps to 5 so the file says whether records exist; a version 4 model is bumped with an empty list. Validation checks handles unique, member ids present with the right directions, and no line in two rectangles. Alternative: a `rectId` on each line. Rejected: the order of sides would live in four places.

**Rectangle names are aliases resolved through the member lines.** `Scope.rects: Map<handle, { left, bottom, right, top }>` holds member handles. `resolveRef` for `r1.prop` reads the member lines' `at` values from `scope.lines`: `left` is the left line's `at`, `width` is right minus left, `umid` the midpoint, `vmid` likewise on v. In `resolveSketch`, a reference to `r1.left` adds a dependency on `(leftLine, at)`; `width` and `umid` on both u lines. No new nodes, so a rectangle's aliases cost nothing in ordering. The error for an unknown property lists the eight names.

**`addRectangle` records; explode and group are record-only edits.** `explodeRectangle` filters the record out. `groupRectangle(sketchId, lineIds)` sorts the four by direction and position, checks each run end is a bare reference to a perpendicular member's `at` (using `isAttachment` against the member set), and refuses otherwise with a message naming the count or the unattached line. `removeLines` drops any record naming a removed line.

**Form writes to lines.** `setRectSlot(sketchId, rectId, slot, value)` with slot in left, right, bottom, top, width, height. Sides call `setLineSlot(member, 'at', value)`. Width: if the right line's `at` is an expression, refuse naming it; if the value is a number, write `leftResolved + value`; if an expression, write `` `${left.handle}.at + (${value})` ``. Height likewise. Left and Bottom move that line only; the far line keeps its own position, so the size changes. This matches editing the line and is the assumption recorded in the proposal.

**Version 3 goes straight to 5.** `migrateV3` produces version 5: lines as before, a record per rectangle with the original handle and ids `${rectId}_l` and so on, and no rewrite of `r{k}.prop` references, which resolve through the record. Size-driven axes still become `<near>.at + size` on the far line. `migrateV4` only bumps the version and adds empty `rects`; version 4 files existed only in browser storage during development, so their rewritten expressions and missing records are accepted, and grouping recovers a record by hand. `parseDocument` chains 1 to 2 to 3 to 5 and 4 to 5.

**Shape list naming.** A region whose corner lines are a rectangle's left and bottom members and whose bounds equal the rectangle's resolved bounds reads by the rectangle's handle. Otherwise "Region". The rectangle's own resolved bounds come from its member lines' positions.

**Form placement.** `Properties.tsx` renders `RectangleProperties` above `LineProperties` when the single selected line has a record, with a small "Left", "Right", "Bottom", or "Top" tag on the side the line is. A `Make rectangle` button appears in the sketch properties when exactly four lines are selected.

## Risks / Trade-offs

- [Two vocabularies for the same value, `r1.right` and `l3.at`] → The rectangle form and the link tool write line names; `r1.*` is what you type by hand or what migration kept. Both display their value.
- [Group refuses attached-by-number corners] → The message names the line whose end is a number; the fix is redrawing that side or typing the attachment. Automatic attaching on group is a follow-up.
- [Deleting a line silently drops a rectangle] → The line's delete confirmation is the existing one; the notes list this as a candidate for a mention in the message.
