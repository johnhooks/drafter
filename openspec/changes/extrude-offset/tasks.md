## 1. Core

- [ ] 1.1 Add optional `offset: Len` to `ExtrudeFeature` in `src/core/model/types.ts` and validate it in `validateExtrude` with `checkLen` allowing zero when present; verify the validation test in `tests/core/evaluate.test.ts` accepts an extrude with no offset, with offset 0, and with an expression, and rejects a non-length offset
- [ ] 1.2 In `evaluate`, resolve the offset against parameters with an `Offset:` error prefix, shift the resolved plane by `normal * offset`, pass the shifted plane to `applyExtrude`, and record the shifted `plane` and the resolved `offset` on the extrude result; verify evaluate tests for the "Offset start" box bounds, the pocket cut from z 12" to 16" with the top face intact, and an offset expression naming a missing parameter erroring the extrude in isolation
- [ ] 1.3 Verify face references on an offset extrude through existing `resolveFaceRef` and `findFaceRef`: an evaluate test that the base resolves to the offset plane with the outward normal and the cap to offset plus distance, a side face rectangle spanning from the offset, and a pick test that a point on the base face of an offset extrude resolves to that base reference

## 2. Store and panel

- [ ] 2.1 Add an `Offset` `LenField` to `ExtrudeProperties` after Direction, committing through `updateExtrude`, showing the resolved offset from the result and the `Offset:` error on the field; verify a `tests/ui/actions.test.ts` case that `updateExtrude` with an offset re-evaluates to the shifted body bounds and that undo restores the unshifted body
- [ ] 2.2 Add an e2e step in `tests/e2e/modeler.spec.ts` that extrudes a region, sets Offset to `8`, and reads back the extrude's `offset` and the body's bounds from `window.__debug()`; verify it passes with `pnpm test:e2e`

## 3. Docs and wrap up

- [ ] 3.1 Add an "Offset" section to `docs/src/content/docs/model/extrude-and-bodies.md` after "Distance and direction" with a pocket example in inches, an aside on the sign convention, and a note that a join with an offset can leave a gap; add the `offset` field to `docs/src/content/docs/files/format.md`; verify `pnpm docs:build`
- [ ] 3.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, and `pnpm docs:build` pass and record the results in a notes file in the change directory
