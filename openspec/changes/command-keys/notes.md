# Notes

## Verification

- `pnpm typecheck`, `pnpm build`, `pnpm docs:build`: clean.
- `pnpm test`: 269 tests. New `tests/ui/keys.test.ts`: chord parsing, platform formatting and matching, unique defaults per view, view scoping, the drawing-program defaults, override and reset, conflict detection, bindings surviving a load.
- `pnpm test:e2e`: 25 tests. New `keys.spec.ts`: A, L, R, D switch tools and select the button; the Select tooltip reads "Select (A)"; A during a line chain ends the chain without a line; 1 does nothing in the sketch; a letter types into a Position field; rebinding Select to V survives a reload and works, with the tooltip updated; Line to V is refused naming Select; Fit to V is allowed; Reset restores A. Every earlier key step (undo, view keys, Delete, X, Escape) passes through the new handler.
- `pnpm kit:test`: 28.

## Decisions made during implementation

- Delete keeps Backspace as a fixed alias beside the rebindable chord, since a command holds one chord and the spec names both keys. The alias is not shown in the Keys panel.
- The views register their callbacks (camera `goTo` and `fit`, the tool's `cancel` and Escape/Enter consumption, the toolbar's dialogs and file actions) in a module-level hook object rather than the store, because they close over refs and animation frames.
- The extrude command selects the new feature through a hook, as the toolbar button did, so the extrude's properties open after Extrude.
- The panel file is `KeyBindings.tsx`; `Keys.tsx` collided with `keys.ts` on the case-insensitive file system.
- A tooltip does not open on a disabled button, so Undo shows its key only once there is something to undo.
