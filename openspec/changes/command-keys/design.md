## Context

Keys are handled in three places: `App` (undo and redo), `ModelView` (1 to 6, Home, F, Escape, Space and Alt as modifiers), and `SketchEditor` (Space, then `tool.key()` for Escape, Enter, Delete, Backspace, X). Toolbar buttons and the More menu dispatch directly. The store's actions are pure `(state, payload) => state`, which is the undoable half of a command pattern; nothing sits above them. Preferences for theme and display toggles are persisted in `persist.ts` with one key each. See proposal.md.

## Goals / Non-Goals

**Goals:**
- One table of commands that buttons, menus, and keys all read, so a label, a key, and an enabled rule exist once.
- Keys as data, overridable per browser, with conflicts caught at entry.

**Non-Goals:**
- A command palette, key sequences, or per-document keymaps.
- Turning the store's actions themselves into command objects; they stay pure functions.

## Decisions

**Commands are a static table in `src/ui/commands.ts`.**
```ts
interface Command {
  id: string            // 'tool.select', 'view.front', 'edit.undo'
  label: string
  view: 'model' | 'sketch' | 'any'
  key?: string          // default chord
  when?: (s: State) => boolean
  run: (ctx: CommandContext) => void
}
```
`CommandContext` carries `dispatch`, the store state, and the view-owned callbacks the commands need but the store does not hold: `goTo`, `fit` from `ModelView` and `cancelTool` from `SketchEditor`. Each view registers its callbacks in a small `useCommandContext` ref on mount. Alternative: move camera moves into the store. Rejected: `goTo` eases through frames and belongs to the view; the context is the seam that keeps it there.

**Escape stays partly in the tools.** A tool with a drag or chain in progress consumes Escape and Enter itself, as today; the `cancel` command runs only when the tool has nothing in progress, then clears pick modes and the selection. Tool switching calls `cancelTool` first so a chain never survives a tool change.

**Chords.** `keys.ts` parses `Mod+Shift+Z` into `{ key, mod, shift, alt }` and matches a `KeyboardEvent` with `Mod` mapped to `metaKey` on macOS and `ctrlKey` elsewhere, using `e.key` uppercased for letters and `e.key` as-is for named keys. Formatting goes the other way for tooltips and the dialog, showing Cmd or Ctrl by platform. Space and Alt as drag modifiers are not chords; they stay where they are.

**Bindings preference.** `keys: Record<commandId, string | null>` in the store, `null` meaning unbound, persisted as `drafter.keys` beside the theme and display. `bindingOf(cmd)` is the override if present, else the default. Conflict check: same chord, same or `any` view, different command.

**One handler in `App`.** On keydown: skip if the target is text; find commands whose view matches the mode and whose chord matches; skip those whose `when` is false; run the first. `preventDefault` when one ran. The three existing listeners lose their key branches; `ModelView` keeps Space and Alt, `SketchEditor` keeps Space and the pass to `tool.key()` for Escape and Enter only.

**Controls read the table.** A `useCommand(id)` hook returns `{ label, tooltip, enabled, run }`; the toolbar's tool group, Undo and Redo, Extrude, Finish, and the view keys' equivalents in the cube tooltip use it. The More menu's file actions become commands without keys, so the table is complete even where nothing is bound.

**Keyboard shortcuts dialog.** A kit `Dialog` opened by a `help.keys` command from the More menu and bound to Mod+/ in both views: a list of commands with chord and view, a `TextField` for the selected one whose validate parses the chord and checks conflicts, committing to `setKey`, and a Reset button that clears the override map. Validation messages name the conflicting command's label. The dialog's open flag is component state in the toolbar beside the other dialogs, not store state. Alternative: a Keys section in the document properties. Rejected: those properties are replaced by the sketch's while a sketch is open, so the tool keys could only be read from the one view where they do not apply.

## Risks / Trade-offs

- [A letter key steals a keystroke meant for a field that does not report as text] → The text check covers inputs, text areas, and contentEditable, the same rule the existing handlers use; the kit's fields are all inputs.
- [Rebinding Escape or Mod+Z to something odd] → Allowed; Reset restores. Escape's cancel is also reachable by clicking away.
- [The view cube has no command, so its faces cannot be rebound] → Cube clicks stay clicks; the view commands cover the keyboard.
