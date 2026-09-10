## Why

Every edit re-evaluates the model and there is no way back. A mistyped distance, a link on the wrong edge, or a cascade delete that took more than expected can only be repaired by hand. Undo is expected in any editor, and the store was built so it is cheap: documents are immutable values.

## What Changes

- Undo and redo for every change to the document: features, rectangles, slots, parameters, title.
- Keyboard: Cmd or Ctrl plus Z undoes, Shift added redoes. Toolbar buttons show the same, disabled when nothing is there.
- One entry per user gesture. A rectangle drag, an inline dimension commit, a link, a slot edit, a delete cascade, a parameter rename that rewrites many expressions: each is one entry. Consecutive keystrokes in a text field coalesce into one entry.
- Selection, mode, tool, view pan and zoom, and notices are not on the stack. After an undo the current mode stays, except that a sketch being edited that no longer exists returns to the model view.
- Loading a document, opening a file, or starting a new document clears the history.
- History is capped at 200 entries and is not saved.

Not in this change: undo of view changes, a history panel, branching history.

## Capabilities

### New Capabilities
- `undo-redo`: what is undoable, grouping into entries, keyboard and toolbar access, and interaction with modes and loading.

### Modified Capabilities
None.

## Impact

- Store: history stacks beside the document, an `undoable` wrapper for actions, coalescing rule for text edits.
- UI: two toolbar buttons and a key handler.
- No change to the file format.
