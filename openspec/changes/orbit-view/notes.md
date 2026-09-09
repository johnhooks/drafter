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
- The cube's face normals are in gizmo space (y up); they are remapped to the
  model's z-up frame before finding the nearest view.
