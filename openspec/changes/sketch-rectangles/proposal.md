## Why

Since lines replaced rectangles, a rectangle drawn with the Rectangle tool is four loose lines that only look like one. Selecting it gives no form, its old name `r1` is gone from expressions, and its width can only be typed as a plain number on a canvas label. A rectangle is worth keeping as a thing of its own: four lines plus the promise that they stay a rectangle, made by the tool, named, editable as a whole, and droppable back to its lines when the promise is in the way. Only 0 and 90 degree lines exist here, so that promise is just the four corner attachments the tool already makes.

## What Changes

- A sketch may hold rectangles: named records (`r1`, `r2`) grouping four member lines, left, bottom, right, top. The lines stay ordinary lines with their corner attachments; the record is the group and its name. A line belongs to at most one rectangle.
- The Rectangle tool creates a rectangle record with its four lines. Explode removes the record and leaves the lines. Grouping four selected lines that close a rectangle makes a record. Deleting a member line dissolves the rectangle.
- Expressions can name rectangles again: `r1.left`, `r1.right`, `r1.bottom`, `r1.top`, `r1.width`, `r1.height`, `r1.umid`, `r1.vmid`, each resolved from the member lines.
- A rectangle form in the properties panel: Left, Right, Bottom, Top write the member line's position; Width and Height write the far line as the near line plus the value, all accepting expressions. An Explode action sits with it.
- The shape list names a region that is exactly a rectangle's area by the rectangle's handle.
- The file becomes version 5. Version 3 files convert straight to it: rectangles become rectangle records with their original handles and expressions that named `r1` survive unchanged. Version 4 files, which only ever existed in browser storage during development, get their version bumped and carry no records; grouping recovers them. This version joins the version-1 collapse recorded in `file-format-v3`.

Assumed, from the discussion: typing Left or Bottom moves that edge and changes the size, the same as editing the line; translating a whole rectangle is not in this change. Canvas width and height labels keep taking plain lengths; expressions go in the form.

Not in this change: angle constraints, moving a rectangle as a unit, rectangles as extrude inputs (regions remain the input).

## Capabilities

### New Capabilities
- `sketch-rectangles`: what a rectangle record is, how it is made, exploded, grouped, and dissolved, its names in expressions, and its form.

### Modified Capabilities
- `sketch-expressions`: the scope names rectangles by handle again.
- `sketch-editor`: the rectangle form when a member line is selected, the group action, and the shape list naming rectangles by handle.
- `document-file`: version 5 with rectangle records; version 3 converts directly to it keeping handles and expressions; version 4 bumps.

## Impact

- Core: `SketchRect` on `SketchFeature` in `types.ts`; `validate.ts`; the expression scope and `resolveSketch` dependency mapping; `migrate.ts`.
- Store: `addRectangle` records the rectangle; `explodeRectangle`, `groupRectangle`, `setRectSlot`; `removeLines` dissolves.
- UI: `Properties.tsx` rectangle form and shape list; a group action.
- Tests: core resolution, validation, migration; store actions; an e2e spec for the form, explode, group, and migration.
- Docs: driven-slots, expressions, dimensions, tools-and-snapping, format.
- Ordering: `sketch-lines-and-regions` and `sketch-display-toggles` must be archived before this change, since all three modify `sketch-editor`.
