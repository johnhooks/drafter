## 1. Foundations in the app

- [x] 1.1 Add `undo` and `redo` icons to the kit `Icon` set with stories; verify the Icon story shows them
- [x] 1.2 Import kit styles once in `main.tsx`, wrap the app in `ThemeProvider`, add `theme` and `setTheme` to the store with persistence and restore; verify a store test for persistence and an e2e that dark survives a reload
- [x] 1.3 Rebuild `LenField` on the kit `TextField` keeping its props; verify the existing constraint e2e scenarios for typed slots still pass

## 2. Toolbar

- [x] 2.1 Rebuild the toolbar with kit components including undo and redo icon buttons, the tool toggle group, Dims, Extrude, Finish, and the overflow menu with file actions and the theme section; verify e2e for tool switching, extrude, export, open, and theme change
- [x] 2.2 Replace the New sketch dropdown with a dialog; verify e2e that creating on XY at an offset and picking a face both work

## 3. Timeline and confirmations

- [x] 3.1 Rebuild the timeline as a `ListBox` with handle details, error tone and message, edit and delete actions; verify e2e for selection, edit, and error display
- [x] 3.2 Replace `window.confirm` with `ConfirmDialog` for delete cascade and new document; verify e2e that the dialog lists dependents and that cancel leaves the document unchanged

## 4. Properties

- [x] 4.1 Rebuild document properties and the parameters section with kit fields and a `ListBox`; verify the parameters e2e scenarios pass
- [x] 4.2 Rebuild sketch properties with rectangle and constraint lists as `ListBox` inside `Disclosure` sections; verify the constraint e2e scenarios pass
- [x] 4.3 Rebuild rectangle and extrude properties with `Row`s of `LenField`s and `Select`s; verify the slot-edit and extrude e2e scenarios pass

## 5. Notices and cleanup

- [x] 5.1 Forward store notices to kit toasts with tones and timeouts, mount `ToastRegion`; verify e2e that a refusal shows as a persistent toast and a corrupt-storage notice appears
- [x] 5.2 Remove replaced rules from `styles.css` and the old `Notices` component; verify `pnpm build`, `pnpm test`, `pnpm test:e2e` pass and record results in a notes file in the change directory
- [x] 5.3 Update the docs Run It page's screen layout description and the Tools page for the New sketch dialog and overflow menu; verify `pnpm docs:build`
