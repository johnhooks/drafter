# Notes

Date: 2026-09-08

The file is now `{ version: 3, model, view }`. The store keeps the model under
its existing `doc` field to avoid a wide rename and adds `view` beside it; only
`doc` is snapshotted for undo. `fileOf(state)` assembles the file, adding the
open sketch id when a sketch is being edited. `loadFile` restores the camera and
reopens that sketch if it still exists. The 3D camera is positioned from the
stored spherical state on mount, and drei's OrbitControls write zoom and pan
back through `setCamera`, throttled to one storage write per 250 ms.

Verification: `pnpm test` (207), `pnpm test:e2e` (12, including `file.spec.ts`),
`pnpm typecheck`, `pnpm build`, `pnpm docs:build`.

## Observations

- Restoring the open sketch changed an assumption in the placement test, which
  expected a reload to land in the model view. That is the intended behaviour
  change of this file format, so the test now asserts the sketch reopens.
- Core keeps `Document` as an alias of `Model`, so evaluation and its tests were
  untouched; only parse, serialize, validate, and migrate changed.
- Recorded in the proposal: collapse versions 1 to 3 into a single version 1 and
  delete the migrations before the first release.
