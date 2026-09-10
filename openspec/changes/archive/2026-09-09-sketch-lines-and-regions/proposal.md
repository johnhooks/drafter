## Why

A sketch can only hold rectangles, so anything that is not a rectangle has to be built as several overlapping ones, and a rectangle cannot be divided: a line drawn across it does nothing. Making the axis-aligned line the only sketch primitive, and computing the closed regions the lines enclose, lets one sketch describe any rectilinear outline, lets a line split a region into parts that extrude separately or together, and removes the special-case rectangle from the model, the constraints, the tools, and the file.

## What Changes

- **BREAKING** A sketch holds lines, not rectangles. A line is horizontal or vertical, has a position on the axis it crosses and two endpoints along the axis it runs on, and may be marked construction. Rectangles are gone from the model.
- Regions are computed, never stored: the bounded areas enclosed by the non-construction lines. An unclosed set of lines encloses nothing and shows no fill. Construction lines never bound a region.
- **BREAKING** An extrude references regions, not rectangle ids. A region is identified by the corner where two of its bounding lines meet, so the reference follows the lines when they move. Selected regions extrude together as one operation; a region split by a later line keeps the part at that corner.
- The Rectangle tool stays as a shortcut that emits four lines whose endpoints are attached to each other. A new Line tool draws chained axis-aligned lines; an endpoint that lands on a perpendicular line is attached to it, so a splitting line follows the edges it touches.
- Constraints move to line slots: a line's position, and the two-of-three slots of its run. Expressions name lines by handle (`l1.at`, `l2.right`, `l3.top`, `l3.length`). The link tool constrains one line's position to a parallel line or a face edge. Endpoint attachments are constraints but are not listed as dimensions.
- Regions show their bounding width and height as editable labels; free lines show their length. Driving dimensions and their placements move to line slots and region labels.
- Face references name a region and a face of its extrusion: cap, base, or a side identified by the bounding line that produced it.
- **BREAKING** The file becomes version 4. Version 3 rectangles migrate to four attached lines each, extrude rectangle ids to region corners, and face references to the new form. This version joins the version-1 collapse recorded in `file-format-v3`.

Not in this change: diagonal or curved lines, dragging geometry with the mouse, offset or mirror tools, references between sketches, drawing sheets (which read bodies only and are unaffected).

## Capabilities

### New Capabilities
- `sketch-regions`: how regions are computed from lines, how a region is identified across edits, its box decomposition, its boundary faces, and how failures report.

### Modified Capabilities
- `sketch`: lines replace rectangles as the content of a sketch; handles, slots, zero-length rule, construction flag, deletion behaviour.
- `sketch-constraints`: handles and dependency ordering are per line slot; the constraint list omits endpoint attachments; failed lines instead of failed rectangles.
- `sketch-expressions`: the scope names lines instead of rectangles, with direction-specific properties.
- `sketch-link-tool`: links constrain line positions; driving dimensions are drawn for line slots.
- `sketch-dimension-layout`: placement is stored per line slot and per region label.
- `extrude`: inputs are regions; each region becomes the boxes of its decomposition; default target unchanged.
- `sketch-editor`: Line tool, region hover and selection, region fills, construction toggle, line selection, region and line labels, extrude from selected regions.
- `sketch-planes`: a face reference names a region and a cap, base, or side face by bounding line.
- `document-file`: version 4 and the version 3 migration.

## Impact

- Core: `SketchLine` replaces `SketchRect` in `types.ts`; `resolveSketch` resolves per slot; a new `regions.ts` computes regions from resolved lines; `extrude.ts`, `pick.ts`, `planes.ts`, `validate.ts`, `migrate.ts`, `deps.ts`, `params.ts` (rename rewriting), and the expression scope change shape.
- Store: selection holds line ids and region corners; rectangle actions become line, rectangle-helper, and region actions; delete replaces references to a removed line with numbers.
- UI: `SketchEditor` renders lines, regions, and labels; `tools.ts` gains `LineTool` and reworks `RectTool`, `SelectTool`, `LinkTool`; `Dimensions.tsx` lays out line dimensions and region labels; `Properties.tsx` shows line and region lists and line slots; `Timeline.tsx` and the extrude panel count regions.
- Tests: core tests for regions, resolution, migration, extrude; store tests for line and region actions; every e2e spec that draws rectangles or reads `rects` or `rectIds`; the debug hook.
- Docs: what-it-is, first-part, planes-and-sketches, extrude-and-bodies, tools-and-snapping, dimensions, back-faces, driven-slots, expressions, link-tool, format; `AGENTS.md` where it says rectangles.
- Ordering: `sketch-extrude-modeler`, `sketch-constraints`, `dimension-placement`, and `file-format-v3` must be archived before this change is archived.
