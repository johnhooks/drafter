## Context

`ModelView` uses drei's `OrthographicCamera` and `OrbitControls` with `enableRotate={false}`; the camera position is a constant. `BodyMesh` shades faces by fixed orientation. `file-format-v3` adds `view.camera` (azimuth, elevation, zoom, centre) to the store and file. End-to-end helpers hard-code the isometric projection.

## Goals / Non-Goals

**Goals:**
- Free orbit that settles on readable views.
- Everything camera-related driven from `view.camera` in the store, so persistence and the cube are trivial.

**Non-Goals:**
- Perspective, hidden lines, named views.

## Decisions

**Camera from state, not from controls.** The camera's position and up vector are derived each render from `view.camera` (spherical: azimuth, elevation, a fixed distance, around `center`) and `zoom`. `OrbitControls` remains for its input handling with `enableRotate` on and `mouseButtons` set to right for rotate, middle for pan, left disabled unless Alt is held (drei exposes `mouseButtons` and the Alt case is handled by swapping the mapping while Alt is down). Its `onChange` writes azimuth, elevation, zoom, and target back to the store through a throttled `setView`; its `onEnd` runs the snap. Alternative: let controls own the camera and read it only for saving. Rejected: two sources of truth, and the cube and keys would have to reach into the controls.

**Snap.** Ten canonical `(azimuth, elevation)` pairs: six orthos at elevation 0 or plus or minus 90, four isos at elevation 35.264 and azimuths 45, 135, 225, 315. On release, find the nearest by angular distance on the sphere; if within 8 degrees, animate to it over 150 ms with an ease-out, writing intermediate values through `setView` so the cube follows. The default iso is the 315 azimuth (front-left-above), matching today's constant.

**Orbit centre.** `center` is the bounding-box centre of the visible bodies, recomputed on F and when the model changes while the user has not panned; a pan sets `center` explicitly and stops the automatic recentring until the next F. Elevation is clamped to plus or minus 89 degrees.

**View cube.** drei `GizmoHelper` with `GizmoViewcube` in the bottom-right, `onUpdate` mapped to the canonical view whose direction matches the clicked face, edge, or corner, then the same eased move.

**Shading.** `BodyMesh` uses a `MeshLambertMaterial` with a directional light attached to the camera plus a low ambient, so brightness follows the angle to the viewer and the six orthos still show their front face lightest. Edge lines unchanged.

**Keys.** A keydown listener in `ModelView`, skipped when the target is an input; 1 to 6, Home, F. Escape continues to cancel pick modes.

**End-to-end helpers.** `isoPoint` becomes `screenPoint(page, x, y, z)` that reads `view.camera` from the debug hook and projects with the same spherical maths, so tests hold for any view. A test turns to the back, picks a face, and checks the sketch plane normal.

## Risks / Trade-offs

- [Snap fights a user who wants a slightly off angle] → 8 degrees is narrow; outside it the camera stays put. Documented in the guide.
- [Right-drag conflicts with the context menu] → `onContextMenu` is already suppressed on the canvas.
- [Lambert shading changes the look of the default view] → Light direction is tuned so the default iso matches today's tones within a step; the Storybook-free check is the existing screenshot walkthrough.
