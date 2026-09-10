# Notes

Date: 2026-09-08

Undo and redo are document snapshots pushed by the store's single entry point,
`withDoc`. Every document-changing action goes through it, and a test runs each
one against a fixture to prove the stack grows. Typing actions carry a coalesce
key so consecutive keystrokes within two seconds are one entry. Undo and redo
reconcile view state: the sketch editor closes if its sketch is gone and stale
selection ids are dropped.

Verification: `pnpm test` (195 tests), `pnpm test:e2e` (7 tests), `pnpm typecheck`,
`pnpm build`, `pnpm docs:build`.

## Observations

- The end-to-end test found a real bug in the app's `LenField`: Escape reset the
  draft and blurred, but the blur commit still saw the stale draft and committed
  it. A ref now guards the commit, the same fix the kit's TextField already had.
- Cmd+Z inside a text field is left to the browser, which does edit the draft;
  the document is untouched until the field commits. The test reverts the draft
  with Escape before leaving the field.
- The toolbar buttons are plain buttons for now; the panel migration will replace
  them with kit IconButtons.
