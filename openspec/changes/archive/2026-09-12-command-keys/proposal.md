## Why

Every keyboard shortcut is hard-coded where it is handled: three key listeners in three components, each with its own `if` chain, and the toolbar buttons and menu items call the store directly with their labels and enabled rules written beside them. There is no key to switch tools at all, so someone used to a drawing program reaches for A and nothing happens. Putting every user-triggered action behind one command table separates what a command does from how it is invoked, and once keys are data, letting the user change them is a small panel over that table.

## What Changes

- A command registry: every action the user can trigger from a key, a toolbar button, or the menu is a command with an id, a label, the view it applies to, an enabled rule, and a default key. Buttons and menu items read their label, tooltip, and enabled state from it, so a key shows in the tooltip and is never written twice.
- One key handler resolves a pressed chord against the active bindings and runs the command. Keys are ignored while a text field has focus. Tools keep handling Escape and Enter for a drag or chain in progress, since that is tool state, not a command.
- Tool keys in the drawing-program style: A selects the Select tool, L Line, R Rectangle, D Link. The twelve existing keys move into the table unchanged: undo and redo, 1 to 6, Home, F, Delete and Backspace, X, and Escape's cancel and clear.
- Keys are viewable and customisable from either view: a Keyboard shortcuts dialog, opened from the More menu or with Mod+/, lists every command with its chord, a field to retype it, a conflict message, and a reset. It lives in a dialog rather than the document properties because those are hidden while a sketch is open, which is where most keys apply. Bindings are a browser preference like the theme and the display toggles, not file content.

Not in this change: chords with more than one key in sequence, a command palette, or keys for the More menu's file actions beyond what they have today (none).

## Capabilities

### New Capabilities
- `commands`: the registry, invocation from keys and controls, the default bindings, and their customisation.

### Modified Capabilities
- `sketch-editor`: tool switching by key; Delete and X become commands.
- `model-view`: view keys become commands.
- `undo-redo`: the undo and redo keys become commands and their tooltips read the bound chord.

## Impact

- UI: a `commands.ts` table and a `keys.ts` chord matcher; one key handler in `App`; `AppToolbar`, `ModelView`, `SketchEditor`, and `tools.ts` lose their key handling; a Keyboard shortcuts dialog opened from the More menu and a `help.keys` command; a `keys` preference in the store and `persist.ts`.
- Kit: none; the existing `Dialog` and a `TextField` with a validate function are enough.
- Tests: unit tests for chord parsing, matching, and conflicts; e2e for tool keys, opening the dialog from a sketch, a rebound key, and a conflict refusal; the existing key steps keep passing.
- Docs: tools-and-snapping gets the full key table and the dialog.
- Ordering: `sketch-rectangles` must be archived before this change, since both modify `sketch-editor`.
