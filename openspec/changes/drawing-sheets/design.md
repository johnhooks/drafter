## Context

Builds on `sketch-extrude-modeler`: bodies are unions of disjoint axis-aligned boxes with `faces(body)` available, lengths are integer sixteenths, the sketch editor already has an ordered snapper list and tools as state machines, state is a zustand store with pure actions, and the 3D view is react-three-fiber. See that change's design for those decisions. This change adds a second mode to the app and a second kind of content in the document.

## Goals / Non-Goals

**Goals:**
- Exact hidden-line orthographic views, reusing the axis-aligned property so no floating point geometry is needed.
- Paper-space annotations that print at true scale and do not depend on screen size.
- Reuse of the snapper and tool infrastructure rather than a second copy.

**Non-Goals:**
- Hidden lines for the isometric sheet (it is a raster of the 3D view).
- Associative dimensions that track model edges through edits; detachment detection is the substitute.
- Any page size but letter, or multiple views per page.

## Decisions

**Projection is exact segment-minus-rectangles.** For a view direction, every exposed face rectangle from `faces(body)` becomes either an occluder (faces whose normal points at the viewer, projected to a rectangle with a depth) or is ignored (faces pointing away contribute no visible edges, and their edges coincide with other faces' edges anyway). Candidate edges are the four edges of every exposed face (all directions), projected to axis-aligned segments with a depth. An edge is hidden on the part of its length covered by an occluder strictly nearer than the edge. Segment minus a set of intervals is exact integer arithmetic. Coplanar face edges are removed before this step by taking the merged face outlines rather than raw rectangles. Finally, coincident segments merge with visible winning. Alternatives: three.js line rendering with depth (raster, not exact, cannot dash reliably), or a general polygon hidden-line algorithm (unneeded while everything is axis-aligned).

**Side views share code with a sign flip.** Left is right with u negated; top is front with the v axis swapped for y. One projection routine takes a `ViewFrame { u: Axis, v: Axis, depth: Axis, uSign, depthSign }`.

**Sheet rendering is a pure function to SVG, in paper inches.** `renderSheet(sheet, model, index, total, date): string` produces an SVG with `width="11in" height="8.5in"` and a `viewBox` in inches, containing the page frame, the view group (a transform of scale and centring applied to the view-coordinate segments), annotations, and the title block. Screen display embeds the same SVG and zooms it; printing and export use it unchanged. Text and line weights are set in paper inches inside the SVG so they are scale-independent by construction. Dashed hidden lines use `stroke-dasharray` in paper inches.

**Isometric sheets embed a PNG.** On sheet render, the r3f scene is framed to the target's bounding box and rendered off-screen with `gl.render` on a hidden canvas at a pixel size equal to the drawing area at 300 DPI, then embedded as a data URL in an `<image>` element. Rendering is cached by (target, model version) so pan and zoom on the sheet do not re-render. Alternative: vector hidden-line isometric. Deferred; it would need general polygon clipping.

**Annotations store view coordinates for geometry-related points and paper coordinates for free text.** Dimension points and leader endpoints are in view sixteenths so they stay on the geometry when the scale changes. Note text position is in paper inches so notes stay where they were put on the page. Detachment is checked after every model change by testing each dimension point against the projection's vertex list and segments; the check is O(points x segments), fine at this scale.

**Tools and snapping reuse the sketch editor's interfaces.** The sheet editor instantiates the same `Tool` interface and the same `snap(pointer, ctx)` with a different candidate source (projection vertices and segments instead of sketch rectangles). Dimension placement is a three-state tool; the note tool is two states; select is shared. The pointer-to-inches conversion goes through paper then view space.

**Print uses a dedicated print route.** Printing renders the chosen sheets into a hidden container of page-sized SVGs and a `@page { size: letter portrait | landscape }` rule per sheet via a wrapper class; everything else is `display: none` under `@media print`. Browsers honour per-page orientation unevenly, so the fallback is that all pages print in the orientation of the first sheet, noted as a risk. Print scale relies on the SVG being sized in inches and the browser's 100% print setting.

**Document format.** `sheets?: Sheet[]` added to the version 1 document; absent means none. No migration. Validation extends the existing hand-written validator.

**Project layout additions.**
```
src/core/projection/{frame,project,hidden}.ts
src/core/sheets/{types,layout,render,annotations,titleBlock,validate}.ts
src/ui/sheets/{SheetsMode,SheetList,SheetProperties,SheetView,tools/{dimension,note}}.tsx
src/ui/print.ts, print.css
tests/core/projection/**, tests/core/sheets/**
```

**Testing.** Vitest on projection with bodies built from the modeller's own operations: single box, joined pair, pocket, through hole, box behind box; assertions on the sorted segment lists with visibility. Sheet render snapshot tests plus assertions on title block text, scale transform, and dimension text placement. Detachment tests. Editor and print are manual walkthroughs in tasks.

## Risks / Trade-offs

- [Per-page orientation in print is inconsistent across browsers] → Default new sheets to landscape so most documents are uniform; document the limitation; SVG export is the fallback for mixed documents.
- [Print scale off because of browser "fit to page"] → Title block carries the scale and a 1" reference bar so a builder can check the print.
- [Hidden-line merge produces many short segments after complex cuts] → Merge collinear adjacent segments of the same visibility as the last step.
- [Raster isometric looks different from vector views on the same document] → Accepted; iso sheets are for orientation, not measurement, and the title block says NTS.
- [Detachment flags dimensions that are still correct, for example a point on a segment that was merged] → Detection tests vertices and segments, not raw box corners, so merged geometry still matches.
