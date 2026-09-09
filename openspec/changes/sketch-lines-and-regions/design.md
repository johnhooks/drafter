## Context

A sketch is `rects: SketchRect[]`, each with per-axis two-of-three slots and a handle. `resolveSketch` orders whole rectangles by their references and resolves each; `applyExtrude` turns each rectangle id into one box; `findFaceRef` and `resolveFaceRef` name faces by `{featureId, rectId, face}`; the expression scope exposes `rects: Map<handle, RectProps>`; dimension placement hangs off `SketchRect.layout`; the editor's tools, hit testing (`data-rect-id`, `data-edge`, `data-dim-slot`), dimensions, properties, timeline, debug hook, and every e2e spec speak rectangles. The file is version 3 and the user has a real development file to carry forward. See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- One primitive with one constraint system; regions, faces, and dimensions all derive from resolved lines.
- Region references that follow the geometry, need no evaluation to create or migrate, and fail loudly.
- Keep the app usable at each step of the work by finishing the core with tests before touching the editor.

**Non-Goals:**
- Non-axis-aligned geometry, curves, or any solver.
- Dragging lines or endpoints with the mouse; edits stay typed, dimension-driven, or through links.
- Preserving extrudes of overlapping version 3 rectangles exactly (see Migration Plan).

## Decisions

**Line storage.** `SketchLine = { id, handle, dir: 'h' | 'v', at: Len, run: AxisSlots, construction?: boolean, layout?: Partial<Record<'at' | 'min' | 'max' | 'size', DimLayout>> }`. `AxisSlots` and `setSlot` are reused unchanged for `run`; `at` is a single slot set directly. Alternative: shared point objects with lines referencing two point ids. Rejected: a corner is already fully determined by the two lines through it, and points would need their own constraint rules and a coincidence solver to keep a line axis-aligned.

**Corners are endpoint attachments, expressed as expressions.** An endpoint that lies on a perpendicular line stores `<handle>.at`. The rectangle helper and the Line tool create them; the deps, rename, delete, and evaluation machinery already handles expressions, so attachment costs nothing new in the core. The constraint list and the dimension drawer recognise the shape (bare `Ref` to a perpendicular line's `at` in a run min or max) and skip it. Alternative: a distinct `{ on: lineId }` slot kind. Rejected: every consumer of slots would need a second case.

**Resolution per slot, not per line.** Nodes are `(line, 'at')` and `(line, 'run')`. A reference to `x.at` depends on `(x, at)`; `x.left`, `x.right`, `x.bottom`, `x.top`, `x.mid`, `x.length` depend on `(x, run)`. Kahn's algorithm over these nodes; mutual attachment between a rectangle's sides is then acyclic. `resolveSketch` keeps its shape: `{ lines: Map<id, ResolvedLine>, errors: Map<id, string>, slotValues }` where a line is in error if either node failed, and `ResolvedLine` carries `dir`, `at`, `run: ResolvedAxis`, and the two endpoints.

**Expression scope.** `Scope.rects` becomes `Scope.lines: Map<handle, LineProps>`, where `LineProps` has `at`, `mid`, `length` and either `left`/`right` or `bottom`/`top`. Unknown-property errors list the valid names for that direction. `face` keeps `RectProps` and is the face's bounding rectangle. `RESERVED` is unchanged.

**Region computation.** `src/core/geom/regions.ts`, pure over resolved non-construction lines:
1. Collect distinct u coordinates (vertical `at`s and horizontal endpoints) and v coordinates, sorted; cells are the grid between consecutive coordinates, plus a sentinel ring for the outside.
2. Walls: for each line, mark the cell edges it covers (a vertical line at u = x covering v from a to b marks the edges between column pairs at x for every row inside [a, b]). Overlaps mark the same edge twice, which is idempotent.
3. Flood fill with 4-adjacency across unmarked edges from the sentinel ring; that component is the outside. Every other component is a region.
4. Decomposition: maximal horizontal strips per row merged with the row above when u extents are identical, ignoring interior walls. Canonical given the cell set, so the result depends only on shape.
5. Corner: the lowest row, then leftmost cell; the vertical line covering its left edge and the horizontal line covering its bottom edge, first in sketch order. Both exist because the neighbours in those directions are not in the region, so those edges are walls.
6. Boundary: cell edges between the region and a non-region cell, grouped into maximal runs per line and direction, each carrying `lineId`, `outward`, `at`, `from`, `to`.

Cost is O(cells) with cells bounded by lines squared; sketches here have tens of lines. Alternative: half-edge planar arrangement with face tracing. Rejected: the grid is exact in integers, far simpler, and axis alignment is already a project invariant.

**Region reference.** `RegionRef = { vertical: string; horizontal: string }` (line ids). Resolution finds the region whose corner is those two lines. When several regions could share... they cannot: a corner cell belongs to exactly one region and the pair identifies the cell. The lookup is `Map<"${vertical}|${horizontal}", Region>`. Alternative: an interior point in sixteenths. Rejected: a point cannot be produced without evaluation, so migration and the rectangle helper would need the evaluator, and it does not follow the geometry when a constraint moves the lines.

**Extrude.** `ExtrudeFeature.regions: RegionRef[]` replaces `rectIds`. `applyExtrude` resolves each reference, makes one box per decomposition rectangle, and applies all boxes as today. `ExtrudeResult.regions: Map<refKey, { ref, region, boxes }>` replaces `boxes`/`rects`. `newBody` on touching boxes: `join` already compacts, so adjacent regions become one body.

**Face references.** `FaceRef = { kind: 'face', featureId, region: RegionRef, face: 'cap' | 'base' } | { kind: 'face', featureId, region: RegionRef, face: 'side', lineId, outward: 1 | -1 }`. `facePlaneOfExtrusion` takes the region bounds for cap and base and a boundary edge for a side; `resolveFaceRef` requires the region to resolve and, for a side, a boundary edge with that line and direction, then checks the body still has a face there as today and returns the bounding rectangle of those body faces as `face`. `findFaceRef` iterates regions, then cap, base, and each boundary edge.

**Selection.** `Selection = { featureId?, bodyId?, lineIds: string[], regions: RegionRef[], constraint?: ConstraintRef }` with `ConstraintRef = { sketchId, lineId, slot: 'at' | 'min' | 'max' | 'size' }`. Reconciliation after an edit drops line ids that no longer exist and region refs that do not resolve in the current evaluation.

**Store actions.** `addLine(sketchId, { dir, at, from, to, attachFrom?, attachTo? })` allocates the handle and writes attachments as `<handle>.at`; `addRectangle(sketchId, u0, u1, v0, v1)` allocates four handles then builds the attached lines; `setLineAt`, `setLineSlot` (run, via `setSlot`), `setConstruction`, `removeLines` (rewrites referencing slots to numbers first, refuses if one has no value, drops region refs naming the lines from extrudes, deletes emptied extrudes with dependents), `setRegionSize(sketchId, ref, axis, value)` for the region labels, `toggleLine`, `toggleRegion`, `selectLines`, `selectRegions`, `setDimLayout(line slot)`, `setRegionLabelLayout`. `removeConstraint` and `setDimLayout` are re-keyed to line slots. `addExtrude(sketchId, regions)`.

**Region label placement storage.** `SketchFeature.regionLabels?: Record<refKey, { width?: DimLayout; height?: DimLayout }>` keyed by `"${vertical}|${horizontal}"`. Any action that edits the sketch prunes keys whose ref does not resolve in the post-edit evaluation. Stored on the sketch because regions are not stored anywhere else.

**Editor rendering and hit testing.** Draw order: grid, reference geometry, region fills (`data-region="v|h"`), lines with a wide transparent hit stroke (`data-line-id`), previews, dimensions, labels. Lines therefore win over regions in `closest()`, satisfying the 6 px rule without distance maths. Region hover uses `:hover` on the fill path; line hover a CSS class. Region fill colours follow the existing selected and hover tones.

**Tools.** `LineTool`: states idle and chaining with `start`; `down` ignores, `up` sets start or commits; projection to the dominant axis; attachment detection asks the host for the perpendicular line whose `at` equals the endpoint coordinate and whose run contains the other coordinate, first in sketch order. `RectTool` unchanged except it calls `addRectangle`. `SelectTool` gains region clicks, `X`, and line hits; the dimension drag logic is unchanged apart from the target type. `LinkTool` chooses lines instead of edges; face edges remain anchors; the parallel check compares `dir` with the face edge's axis. `ToolHost` gains `addLine`, `addRectangle`, `toggleLine`, `toggleRegion`, `perpendicularLineAt`, `lineCoord`, `lineName`, `setLineAt`.

**Dimensions.** `dimensionsOf` walks line slots: `at` links draw across the two parallel lines at the driven line's default end (top end for vertical lines, left end for horizontal) using `drivingLine` with the line's endpoint as the reference; run links draw along the line. Region labels come from a new `regionLabelsOf(regions, layouts)` producing the same `DimSpec`/label shapes so drag, edit, and override code is shared. A free line's length label reuses the size-label path with the line itself as the edge.

**Migration v3 to v4.** Structural only, in `migrateV3(raw)`:
- Per rectangle in sketch order, allocate `l{n}` handles for left, bottom, right, top. Positions: `left.at = u.min`, `right.at = u.max` when both driven; with `size` driven, `right.at = "<left>.at + (<size>)"` or `left.at = "<right>.at - (<size>)"`, wrapping a numeric size as a literal. Same for v. Runs: `left.run = { min: "<bottom>.at", max: "<top>.at" }` and so on.
- A rename map from `r{k}.prop` to line expressions: `left`/`right`/`bottom`/`top` to `<line>.at`; `width` to `(<right>.at - <left>.at)`; `height` likewise; `umid` to `(<left>.at + (<right>.at - <left>.at) / 2)`; `vmid` likewise. Applied by the same token rewriter `renameParam` uses, extended to dotted paths.
- Extrude `rectIds` to `regions: [{ vertical: left.id, horizontal: bottom.id }]`.
- Face refs: `cap`/`base` keep the region of the rectangle; `uMin` to side `left` outward -1, `uMax` to `right` +1, `vMin` to `bottom` -1, `vMax` to `top` +1. A face ref without `rectId` uses the extrude's first rectangle, as `resolveFaceRef` did.
- Layout: `u.min` to `left.layout.at`, `u.max` to `right.layout.at`, `u.size` to `regionLabels[key].width`; v likewise.
Save always writes version 4; `parseDocument` chains 1 to 2 to 3 to 4.

**Validation.** Lines: id, handle, `dir`, `at` length, `run` with exactly two slots, sizes positive when numeric, `construction` boolean, layout keys among `at`, `min`, `max`, `size`. Extrudes: `regions` non-empty, each naming two line ids present in the sketch with the right directions. Face refs: the region's ids in the extrude's sketch, `side` carrying a line id and an outward sign. `regionLabels` keys well formed.

**Debug hook and e2e.** `__debug().selection` exposes `lineIds` and `regions`; `features` exposes lines. Helpers: `drawInches` keeps drawing rectangles through the Rectangle tool; a new `lineInches(page, view, points[])` clicks a chain and presses Escape; `regionAt(page, view, u, v)` clicks inside a region with the Select tool; `tool()` accepts `'Line'`.

## Risks / Trade-offs

- [Four labels per rectangle would clutter the view] → Labels belong to regions and to free lines only; a rectangle shows width and height exactly as before.
- [A split silently shrinks an earlier extrude to the corner part] → Deterministic and documented on the extrude page with the corner rule; the region list shows every region so the other part is one click from its own extrude.
- [Endpoint attachments stored as expressions make deleting a line noisy] → `removeLines` freezes referencing slots to numbers first, so deleting one side of a rectangle leaves three plain lines and no errors.
- [Editing a region's width moves several lines when the extreme is not a single line] → All lines on that extreme move by the same delta; a linked one refuses the whole edit with its expression named, so nothing moves halfway.
- [Coordinate-grid regions are O(n²) cells] → Sketches have tens of lines; a 60-line sketch is under 4000 cells and the fill is linear in cells.
- [The version 3 migration cannot see overlap between expression-driven rectangles] → It references only each rectangle's corner region; the notes list the rule and the user's file is checked by hand after loading.
- [Playwright cannot click zero-height lines] → Lines carry a 10 px transparent hit stroke; tests click at computed positions on that stroke or use labels.

## Migration Plan

1. Land the core with `migrateV3` and tests before any UI change; run the user's recovered file through `parseDocument` in a test fixture and compare body volumes with the version 3 evaluation.
2. Ship the UI; the first load rewrites browser storage as version 4.
3. Rollback is reverting the commits; a version 4 file cannot be read by the previous build, so the user keeps a version 3 download until the change is verified.
4. At release, this version folds into the version-1 collapse recorded in `file-format-v3`.

## Open Questions

- Whether the Line tool should also accept press-drag-release for a single line. Additive to the tool state machine; does not change specs beyond one scenario.
- Whether region fills should show a hatch for regions already extruded in a later feature. Purely visual; can follow.
