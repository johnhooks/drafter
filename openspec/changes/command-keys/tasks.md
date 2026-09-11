## 1. Table and keys

- [x] 1.1 Add `keys.ts` with chord parsing, formatting by platform, and event matching; verify unit tests for `Mod+Shift+Z`, `A`, `Delete`, `1`, Cmd versus Ctrl, and a letter matching case-insensitively
- [x] 1.2 Add `commands.ts` with the full table (tools, construction, delete, cancel, undo, redo, views, fit, extrude, finish, the More menu's file actions) and `CommandContext`; add the `keys` preference with `setKey`, `resetKeys`, `bindingOf`, and conflict detection to the store and `persist.ts`; verify unit tests that every default chord is unique within its view, that `setKey` refuses a conflict naming the other command, that a different view is not a conflict, and that reload keeps overrides

## 2. Handler and controls

- [x] 2.1 Add the single key handler to `App`, the command context registration in `ModelView` and `SketchEditor`, and remove the key branches from their listeners and from `tools.ts` except Escape and Enter during a drag or chain; verify e2e that A, L, R, and D switch tools, that A during a line chain ends the chain, that 1 does nothing in the sketch, that A in a Position field types, and that the existing undo, view, delete, and construction key steps still pass
- [x] 2.2 Make the toolbar tool buttons, Undo, Redo, Extrude, Finish, and the More menu read label, tooltip, and enabled state from the commands; verify e2e that the Select button's tooltip reads "Select (A)"

## 3. Keys panel, docs, wrap up

- [x] 3.1 Add the Keys section to the document properties with a chord field per command, conflict messages, unbind on empty, and Reset; verify e2e that rebinding Select to V works after a reload, that setting Line to A is refused naming Select, and that Reset restores A
- [x] 3.2 Update tools-and-snapping with the full key table and the Keys section, and the timeline page's undo note; verify `pnpm docs:build`
- [x] 3.3 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory

## 4. Keyboard shortcuts dialog

- [ ] 4.1 Move the Keys section out of the document properties into a Keyboard shortcuts dialog opened by a `help.keys` command from the More menu and Mod+/ in both views; verify e2e that Mod+/ in a sketch opens the dialog listing Select with A, and that the rebind, conflict, and Reset steps pass through the dialog
- [ ] 4.2 Update tools-and-snapping and the timeline page's undo note to point at the dialog; verify `pnpm docs:build`
- [ ] 4.3 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and update the notes file
