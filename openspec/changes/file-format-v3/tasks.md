## 1. Types and format

- [ ] 1.1 Add `Model`, `ViewState`, `DocumentFile`, `DEFAULT_VIEW`; keep `Document` as an alias of `Model`; update validation for version 3 with a `view` block and migrate versions 1 and 2 by wrapping; verify tests for a v2 file loading with the default view and a v3 round trip

## 2. Store

- [ ] 2.1 Split state into `model` and `view`, add `setView` with no history push, make `loadFile` restore the view and reopen a stored sketch id or drop a stale one; verify tests that setView does not grow history, undo leaves the view alone, and load reopens or falls back

## 3. Persistence and UI binding

- [ ] 3.1 Save and load the whole file with throttled saves on view change; update the debug hook; verify e2e that reload restores the camera zoom and centre and reopens the sketch
- [ ] 3.2 Bind the 3D camera to `view.camera` on mount and after load, and write zoom and pan changes back; verify e2e that a pan survives Finish and Edit sketch round trips
- [ ] 3.3 Rename `doc` to `model` in end-to-end helpers and specs; verify `pnpm test:e2e` passes

## 4. Docs and wrap up

- [ ] 4.1 Update the File Format page for version 3 and the Saving page for the remembered view; verify `pnpm docs:build`
- [ ] 4.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm build` pass and record results in a notes file in the change directory
