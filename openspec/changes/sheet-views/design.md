## Context

Bodies are unions of disjoint axis-aligned boxes with `faces(body)` derived from them; lengths are integer sixteenths; the document is at format version 5 with a hand-written validator and per-version migrations; the store has a `mode` of model, sketch, pickFace, or pickBody with pure actions; commands carry a `CommandView` of model, sketch, or any and one key handler resolves against the current mode; the sketch canvas draws from the kit's canvas tokens. See proposal.md. This change adds a fifth mode and a second kind of document content. The original drawing-sheets design is the source of the decisions below; they are restated against the code as it is now.

## Goals / Non-Goals

**Goals:**
- Exact hidden-line orthographic views, reusing the axis-aligned property so no floating point geometry is needed.
- A sheet as a pure function to SVG in paper inches, so screen, print, and export are one rendering.
- A mode that fits the store, the command table, and the properties panel the way sketch mode does.

**Non-Goals:**
- Annotations of any kind, and the projection's vertex and segment lists are only produced, not consumed.
- The isometric view.
- Associative geometry references from sheets into the model.

## Decisions

**Projection is exact segment-minus-rectangles.** For a view direction, every exposed face rectangle from `faces(body)` whose normal points at the viewer becomes an occluder, a rectangle in view coordinates with a depth. Candidate edges are the four edges of every exposed face of every direction, projected to axis-aligned segments with a depth. An edge is hidden on the part of its length covered by an occluder strictly nearer than the edge; segment minus a set of intervals is integer arithmetic. Coplanar face edges are removed first by taking merged face outlines rather than raw rectangles. Coincident segments merge with visible winning, then collinear adjacent segments of one visibility merge. Alternatives: three.js line rendering with depth (raster, not exact, cannot dash reliably) or a general hidden-line algorithm (unneeded while everything is axis-aligned).

**Side views share code with a sign flip.** Left is right with u negated; top is front with the v axis swapped for y. One projection routine takes a `ViewFrame { u: Axis, v: Axis, depth: Axis, uSign, depthSign }`.

**Sheet rendering is a pure function to SVG in paper inches.** `renderSheet(sheet, projection, doc, index, total, date): string` produces an SVG with `width="11in" height="8.5in"` and a `viewBox` in inches: page frame, the view group under a transform of scale and centring, the title block. Screen display embeds the same SVG and zooms it; print and export use it unchanged. Text and line weights are paper inches inside the SVG so they are scale-independent by construction; hidden lines use `stroke-dasharray` in paper inches. The sheet is paper and is always black on white; it does not read the canvas tokens.

**Sheets mode is a store mode.** `Mode` gains `{ kind: 'sheet'; sheetId?: string }`; the sheet list and every sheet edit are pure actions on `doc.sheets`, so undo covers them like features. `CommandView` gains `sheet`; `commandsFor` maps the sheet mode to it; the fit command becomes view `any` with a hook the sheets view registers like the model view does. The properties panel shows the sheet panel when the mode is sheet, the way it shows a sketch's.

**Document format.** `sheets?: Sheet[]` and `nextSheetNumber?: number` on the version 6 file, carried on the in-memory document for undo. The positive integer counter advances when a sheet is created and survives deletion, renaming, saving, and reload. When absent, derive it from the highest numbered sheet name. A version 5 file migrates by version bump alone. Validation extends the existing validator; a sheet's target body id is checked for shape, not existence, since existence is a warning at evaluation.

**Evaluation.** Projection runs after evaluation as a derived value keyed by sheet and model version, memoised in the store's evaluation result rather than stored, matching how regions are derived and never stored.

**Last-change date.** The optional top-level `modifiedDate` file field stores the local calendar date in `YYYY-MM-DD` form. Document edits update it; view changes and reload do not. A sheet file without a date uses its opening date. The in-memory document carries this metadata and the sheet fields for undo, while `fileOf` keeps them outside the serialized `model`.

**Print uses a hidden container.** Printing renders the chosen sheets into a container of page-sized SVGs with a `@page { size: letter portrait | landscape }` rule per sheet through a wrapper class; everything else is `display: none` under `@media print`. Browsers honour per-page orientation unevenly; the fallback is all pages in the first sheet's orientation, noted in the docs. Print scale relies on the SVG being sized in inches and the browser's 100% setting, with the title block's 1" bar as the check.

**Project layout additions.**
```
src/core/projection/{frame,project,hidden}.ts
src/core/sheets/{types,layout,render,titleBlock,validate}.ts
src/ui/sheets/{SheetsMode,SheetList,SheetProperties,SheetView}.tsx
src/ui/print.ts, print.css
tests/core/projection/**, tests/core/sheets/**, tests/e2e/sheets.spec.ts
```

**Testing.** Vitest on projection with bodies built from the modeller's own operations: single box, joined pair, pocket, through hole, box behind box, with assertions on sorted segment lists with visibility. Sheet render snapshot tests plus assertions on title block text and the view transform. Migration and validation tests. Playwright for the sheets mode scenarios and the SVG export. Print is checked by hand in print preview and the result recorded in the change's notes, since Playwright cannot observe the print dialog.

## Risks / Trade-offs

- [Per-page orientation in print is inconsistent across browsers] → Default new sheets to landscape so most documents are uniform; document the limitation; SVG export is the fallback for mixed documents.
- [Print scale off because of browser "fit to page"] → The title block carries the scale and a 1" reference bar.
- [Hidden-line merge produces many short segments after complex cuts] → The collinear merge is the last step and is specified.
- [A fifth mode widens every switch on `mode.kind`] → The compiler finds them; the properties panel, the toolbar, the key handler, and the debug state are the four places.
