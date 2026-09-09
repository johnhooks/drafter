## Why

The 3D view has one fixed angle, so the back, the underside, and anything behind a taller body cannot be seen. An orthographic camera that can be turned, with snapping to the canonical views so lengths stay readable, gives the whole model without giving up the drafting feel.

## What Changes

- Orbit the view by dragging with the right mouse button or Alt plus the left button. Left click still picks, middle or Space drags pan, the wheel zooms. Orbit is about the centre of the visible bodies.
- On release, a view within a few degrees of one of ten canonical views eases to it: the four isometrics and the six orthographic faces. Otherwise it stays where it was left.
- A view cube in the corner: click a face for an orthographic view, an edge or corner for an isometric.
- Keys: 1 to 6 for front, back, left, right, top, bottom; Home for the default isometric; F to fit the visible bodies.
- Shading becomes relative to the camera so every side reads with depth.
- The view is stored in the file's `view` part (from `file-format-v3`), so it survives reload and travels with a downloaded file.
- Orthographic only, shaded solids from every angle.

Not in this change: perspective, hidden-line rendering in the view, named views, section views.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `model-view`: the fixed-angle requirement is replaced by orbit with snapping, the view cube, keys, camera-relative shading, and the remembered view.

## Impact

- UI only: `ModelView`, `BodyMesh` shading, a small snap function, end-to-end helpers that compute screen positions from the camera state instead of a hard-coded angle.
- Depends on `file-format-v3` for the stored `view`.
- Ordering: `sketch-extrude-modeler` must be archived before this change is archived.
