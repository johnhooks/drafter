# Notes

Date: 2026-09-08

The camera is driven from `view.camera` in the store. drei's OrbitControls handle
input (right or Alt drag rotates, middle or Space drags pan, wheel zooms) and write
the resulting spherical state back through `setCamera`; on release the nearest of
ten canonical views within 8 degrees is eased to over 150 ms. The view cube maps
a clicked face normal to the nearest canonical view. Keys 1 to 6, Home, and F.
Shading is a Lambert material lit by a light fixed to the camera, so every side
reads with depth.

Verification: `pnpm test` (213), `pnpm test:e2e` (13, including `orbit.spec.ts`),
`pnpm typecheck`, `pnpm build`, `pnpm docs:build`.

## Observations

- The e2e projection helper now derives its projection from the stored camera,
  so face picks work from any angle and the tests hold for any view.
- The first orbit test attempt dragged before the canvas had its real size; the
  helper now waits for it, as the picking helper already did.
- The cube's face normals map straight onto the world frame; an assumed y-up
  remap sent Top to Front and Front to Bottom. Fixed by measuring every face.
- Faces were single-sided with one winding, so the bottom, back, and left faces
  were culled from the angles that could now see them. Faces are wound outward
  from their normal and the material is double-sided.
- Top and bottom views sit at 89 degrees rather than the pole, so a drag from
  them always has a direction to move in; at the exact pole the controls clamp
  and the view locks.
- The ground grid does not write depth, so seen from below it stays behind the
  bodies instead of hatching through them.
- The cube's edge and corner strips carry their direction as the mesh position,
  not as a face normal; the click handler reads the position first. A cube click
  goes to the clicked direction exactly, as drei's own gizmo and Fusion do, so
  edges look straight at an edge and corners give isometrics above or below. The
  ten canonical views remain the drag snap set.
- Key and cube view changes jump exactly rather than easing, so a second press
  during an ease cannot start from a moving value.
