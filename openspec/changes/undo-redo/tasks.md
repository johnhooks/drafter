## 1. Store

- [x] 1.1 Add history stacks to `State`, push and trim in `withDoc` with a coalesce key and `now`; verify tests for push, redo cleared on edit, cap at 200, and coalescing within and beyond two seconds
- [x] 1.2 Implement `undo` and `redo` with view reconciliation; verify tests for the distance scenario, cascade delete as one entry, editing sketch survives, editing sketch removed returns to model, and cleared selection
- [x] 1.3 Give typing actions coalesce keys; verify a test that per-character `renameFeature` calls collapse to one entry
- [x] 1.4 Clear history in `loadDocument` and initial state; verify a test
- [x] 1.5 Add the guard test that every document-changing action grows `past`

## 2. UI

- [x] 2.1 Add Undo and Redo toolbar buttons with disabled states and key tooltips; verify e2e that both are disabled on a fresh document and enabled after an edit
- [x] 2.2 Add the key handler with platform modifier and input skipping; verify e2e that Cmd+Z undoes a distance change, Shift redoes, and that the keys do nothing while a field has focus

## 3. Documentation and wrap up

- [x] 3.1 Add undo to the docs: the Start Here overview line, the Tools and Snapping key table, and a note in Timeline; verify `pnpm docs:build`
- [x] 3.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm build` pass and record the result in a notes file in the change directory
