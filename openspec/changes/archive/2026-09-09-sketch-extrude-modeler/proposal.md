## Why

Drawing cabinets for a builder needs boxes with exact dimensions, not general CAD. The smallest tool that covers cabinets and most other shop-built things is a very small parametric modeller: sketch rectangles on a plane, extrude them into solids, sketch again on any face of what you built, and keep going, with every length snapped to a sixteenth of an inch. That is what "Fusion 360 light" means here.

## What Changes

- New browser-only app (no server) that builds solids by sketching and extruding.
- Coordinate system with Z up. Three principal sketch planes, XZ (front), XY (top), YZ (side), each usable at any offset along its normal. XZ is the default and the first one the UI offers.
- Sketches: rectangles drawn with the mouse on a 2D sketch view of a plane, snapped to a 1/16" grid and to nearby reference edges. Every rectangle's width and height are shown as editable dimensions; position and size are also editable as typed values.
- Extrude: pick rectangles in a sketch, give a signed distance, choose new body, join, or cut. Join and cut act on an existing body with real solid results (cuts remove material).
- Sketch planes attached to faces: click any face of a body in the 3D view and start a sketch on it. The sketch view shows that face and the rest of the model as reference geometry.
- A feature timeline: sketches and extrudes in order. Editing any parameter re-evaluates everything after it. Deleting a feature deletes what depends on it. Features whose references no longer resolve are marked with an error and skipped.
- A fixed isometric 3D view of all bodies with correct hidden surfaces, used for face picking and body selection.
- Autosave to browser storage, JSON download and upload, SVG export of the current sketch, PNG export of the 3D view.

Not in this change: circles or any non-rectangular sketch geometry, sketches on planes that are not axis-aligned, fillets or chamfers, constraints between sketch entities, orbiting the 3D view, timeline reordering or rollback, undo/redo, and dimensioned 2D drawing output for a builder.

The builder drawings are the following change, `drawing-sheets`: printable letter-size sheets with one projected view each, hand-placed dimensions, and notes. DXF export for shops that want it can come after that. Nothing in this change depends on either.

## Capabilities

### New Capabilities
- `dimension-units`: parsing and formatting lengths as inches with fractions, stored exactly as sixteenths.
- `solid-model`: bodies as unions of axis-aligned boxes, union and subtraction, and the exposed faces of a body.
- `sketch-planes`: principal planes with offsets and face-attached planes, with the mapping between plane coordinates and model coordinates.
- `sketch`: a sketch's contents: rectangles on a plane, their fields, validation, and reference geometry.
- `extrude`: the extrude feature: inputs, direction, operation, target, and resulting bodies.
- `feature-timeline`: ordered features, evaluation, edits, dependency deletion, and error handling.
- `sketch-editor`: the 2D sketch UI: drawing rectangles with the mouse, snapping, selection, and typed and inline dimension editing.
- `model-view`: the isometric 3D view: rendering, face picking, body selection, and starting a sketch from a face.
- `persistence-export`: autosave, JSON round trip, sketch SVG export, and 3D view PNG export.

### Modified Capabilities
None. No main specs exist yet.

## Impact

- New codebase: pnpm, Vite, TypeScript, React 19, react-three-fiber and drei over three.js for the 3D view, zustand for state, Vitest. No backend, no network calls.
- The JSON document format (feature list) is the long-lived artifact; later changes must keep reading it.
