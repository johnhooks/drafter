## Why

The properties column stacks the sketch's name, plane, and lists, and only then the form for whatever is selected, so the form lands wherever the lists happen to end and appears "at the bottom when needed". The thing being edited should have a fixed place that does not move as the sketch grows.

## What Changes

- The properties column for a sketch becomes three windows: the sketch's own fields at the top, which minimize to their title bar so the lists take the space; the lists as an accordion in the middle, one open at a time, the open one taking the remaining height and scrolling on its own; and a **Selection** pane at the bottom, always present while a sketch is shown, whose content follows the selection.
- The Selection pane shows the rectangle form for a selected rectangle or a member line, the line form for a single line, Make rectangle for four loose lines, a count for any other multi-selection, and a hint when nothing is selected.
- A divider between the two regions sets the pane's height by dragging or with the arrow keys, double-click restores the default, and the height is remembered across sessions.
- A list or the pane fades at its top or bottom edge when there is more to scroll to in that direction. The divider is a hairline that shows its colour on hover, focus, and while dragging.
- Nothing about the forms themselves, the lists, or the model-mode panels changes.

Not in this change: a selection pane for the model view, or moving the constraint list.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sketch-editor`: the sketch properties gain a selection pane that hosts the line and rectangle forms.

## Impact

- UI: a new `src/ui/PropertiesColumn.tsx` renders the three windows and the divider; `src/ui/Properties.tsx` splits the sketch panel into `SketchFields`, `SketchLists`, and `SelectionPanel`; a new `src/ui/ScrollArea.tsx` carries the scroll cue; `src/ui/persist.ts` stores the pane height; `src/ui/styles.css` lays out the windows, the accordion, the divider, and the fades.
- Tests: e2e tests in `tests/e2e/lines.spec.ts` for the pane content, the divider, the fades, the minimize, and the accordion; an `openList` helper, since existing tests read lists that are no longer all open; a unit test for the stored height.
- Docs: the properties panel section of `docs/src/content/docs/sketch/dimensions.md`.
- Ordering: `rectangle-list` also modifies `sketch-editor` and is archived first.
