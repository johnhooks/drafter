## 1. Project setup

- [ ] 1.1 Scaffold Vite + React 19 + TypeScript with strict mode using pnpm, add three, @react-three/fiber, @react-three/drei, zustand, and Vitest, and verify `pnpm dev`, `pnpm build`, and `pnpm test` run
- [ ] 1.2 Create the `src/core`, `src/ui`, `tests` layout from design.md and add a test that fails if anything under `src/core` imports `react`, `three`, `zustand`, or references `document`/`window`; verify it runs under `pnpm test`

## 2. Units

- [ ] 2.1 Implement `parseLength` covering every accepted and rejected form in `dimension-units`; verify with a table-driven test including `35 1/4`, `35-1/4`, `3/4`, `35.3`, `24"`, `24 in`, `abc`, `-12`, `1/0`, empty
- [ ] 2.2 Implement `formatLength` with reduced fractions; verify tests for `35 1/2"`, `24"`, `3/4"`, `0"`, `35 5/16"`

## 3. Box geometry and bodies

- [ ] 3.1 Implement `Box` (sixteenths bounds), `volume`, `intersects`, `contains`, and `subtract(a, b): Box[]`; verify property tests that pieces are disjoint, inside `a`, and sum to volume(a) minus volume(a intersect b) across a grid of cases
- [ ] 3.2 Implement `Body` with `join`, `cut`, `compact`, `volume`, `bounds`; verify tests for every `solid-model` join and cut scenario using volume and bounds
- [ ] 3.3 Implement 2D rectangle subtraction and rectangle union to rectilinear polygon in `rect2d.ts`; verify tests for L-shape, ring (hole), and disjoint results
- [ ] 3.4 Implement `faces(body)` returning per plane and direction the exposed rectangles and merged outlines; verify tests for six faces of one box, merged top after join, and pocket faces

## 4. Planes, sketches, extrudes

- [ ] 4.1 Implement principal plane definitions and `toModel`/`toPlane` mappings; verify tests for the XY offset and YZ mapping scenarios and round trips on all six normals
- [ ] 4.2 Implement sketch and rectangle types, normalisation of corners, width and height setters, and validation; verify tests for corner order, zero size, and set-width-keeps-origin
- [ ] 4.3 Implement `boxFromRect(plane, rect, distance)`; verify tests for the front-plane positive and negative distance scenarios and one case per plane
- [ ] 4.4 Implement extrude application (new, join, cut, target checks) and default operation from the sketch plane kind; verify tests for the new-body union, dado cut, shelf join, and default-target scenarios
- [ ] 4.5 Implement face references and resolution against evaluated results including the "face removed" check; verify tests for cap resolution, follows-edit, and deleted-feature error

## 5. Evaluation and timeline

- [ ] 5.1 Implement `evaluate(doc)` walking features, producing bodies, per-feature results, reference geometry for sketches, and isolated errors; verify tests for sequential dependency, upstream edit propagation, and missing target error with unrelated features intact
- [ ] 5.2 Implement feature naming, the dependency graph, and `dependentsOf(featureId)`; verify tests for auto naming and the delete-cascade scenario
- [ ] 5.3 Implement document validation and JSON serialise/parse with `version: 1`; verify a round-trip test and a rejection test for a dangling sketch reference

## 6. Store and app shell

- [ ] 6.1 Implement the zustand store and pure actions (add/edit/delete features with cascade, selection, mode, editing) recomputing `eval` on every doc change; verify action unit tests for add sketch, add extrude, edit distance re-evaluates, and delete cascade
- [ ] 6.2 Build `App` with timeline panel, centre area switching between model view and sketch editor, properties panel, and notices; verify by running the dev server and seeing an empty document with a New Sketch action

## 7. Model view (three.js)

- [ ] 7.1 Implement the geometry builder from `faces(body)` rectangles with orientation shading and a `BodyMesh` component with `EdgesGeometry` edges; verify a test that triangle count is two per face rectangle
- [ ] 7.2 Implement `ModelView` with an r3f `Canvas`, drei `OrthographicCamera` at the isometric angle, `OrbitControls` with rotation disabled, and bodies subscribed from the store; verify manually that a cut pocket renders with visible floor and walls
- [ ] 7.3 Implement hover highlight, face picking via r3f pointer events mapped to a face reference, and body selection; verify manually against the click-cap and select-body scenarios
- [ ] 7.4 Implement New Sketch (principal plane with offset, or Pick Face) creating and opening a sketch; verify manually that a sketch on a picked top face opens showing the face

## 8. Sketch editor

- [ ] 8.1 Build the SVG sketch view with grid, origin, axis indicator, coplanar face fills, outlines, zoom, and pan, looking along -normal with v up; verify manually on XZ default and on a back-facing plane that mirroring is shown by the axis indicator
- [ ] 8.2 Implement snapping as an ordered snapper list (corners, edges per axis, sixteenth grid) with the snap kind returned for the indicator in `snapping.ts`; verify unit tests for grid snap, edge beats grid, and corner beats edge
- [ ] 8.3 Implement the tool interface (state, pointer and key handlers, cancel, preview) and the editor's preview rendering shared with committed rectangles; verify a unit test that a tool's preview entities render through the same function as committed ones
- [ ] 8.4 Implement the rectangle tool as a state machine (press, drag with live size, release, zero-size ignored, Escape cancels); verify manually against the drag-creates scenario
- [ ] 8.5 Implement the select tool (click, shift-click, clear, Delete key); verify manually
- [ ] 8.6 Implement inline width and height dimension editing with Enter, blur, Escape, and error handling; verify manually against the type-a-width scenario
- [ ] 8.7 Implement the rectangle properties panel (lower-left u, v, width, height); verify manually against move-by-typing
- [ ] 8.8 Implement Extrude from the toolbar (selected or all rectangles, defaults, opens extrude properties) and Finish; verify manually that the body appears in the model view as soon as a distance is entered and that reopening a sketch shows reference geometry from its point in the timeline

## 9. Persistence and export

- [ ] 9.1 Implement autosave, load with validation, corrupt-storage notice, and New Document with confirmation; verify manually via reload and by writing junk into the storage key
- [ ] 9.2 Implement JSON download and upload with rejection of invalid files; verify manually with a valid and an invalid file
- [ ] 9.3 Implement sketch SVG export with embedded styles; verify by opening the exported file directly in a browser
- [ ] 9.4 Implement 3D view PNG export from the canvas; verify the file opens and matches the screen

## 10. Integration check

- [ ] 10.1 Build a base cabinet carcass end to end: front rectangle extruded to a box, sketch on its top face and cut a pocket, sketch on a side face and join a shelf, then change the first extrude's distance and confirm everything follows; verify `pnpm test` and `pnpm build` pass and record the walkthrough result in a short notes file in the change directory
