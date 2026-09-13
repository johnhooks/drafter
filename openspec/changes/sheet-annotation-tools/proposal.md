## Why

A sheet with only a view is a picture. What makes it a drawing is the measurements and notes placed where a reader needs them. This is the second of three changes replacing the drawing-sheets proposal: it adds hand-placed linear dimensions and notes to sheets, snapped to the projection, with values taken from the true model size. It follows `sheet-views` and uses the vertex and segment lists that change already produces.

## What Changes

- Linear dimensions on a sheet: two snapped points in view coordinates, an orientation, and a dimension line position. The value is the true distance, formatted as inches with fractions, at every scale. Text and line weights are fixed paper sizes; a short dimension puts its text outside the extension lines.
- Notes: text at a paper position, optionally with a leader arrow to a snapped point, several lines allowed.
- Snapping for annotation points to projection vertices, then segments per axis, then the 1/16" grid in view coordinates, through the sketch's snapper list with a projection candidate source.
- Detachment: after a model change, a dimension whose points no longer sit on the projection is marked, drawn in a warning colour, and listed in the sheet's warnings, with its value unchanged.
- Tools in sheets mode: a three-click dimension tool with a live preview, a note tool with inline text entry and shift-drag leader, and select with delete, drag-move, double-click note edit, and typed editing in the properties panel. Tool keys join the command table in the sheet view.
- Annotations are saved on their sheet in the document file.

Not in this change: aligned or angular dimensions, dimensions on the isometric view, any change to how sheets are laid out or printed.

## Capabilities

### New Capabilities
- `sheet-annotations`: linear dimensions and notes on a sheet: definition, drawing, snapping targets, values, detachment, and persistence.

### Modified Capabilities
- `sheet-editor`: gains the dimension tool, the note tool, and annotation selection, movement, editing, and deletion.
- `commands`: sheet tool commands with default keys.

## Impact

- Core: `src/core/sheets/annotations.ts` for types, values, drawing geometry, and detachment; `render.ts` draws annotations; the validator covers them.
- UI: `src/ui/sheets/tools/{dimension,note}.ts` on the sketch's `Tool` interface, a projection snap source for `snap()`, selection and drag in `SheetView`, an annotation properties panel; new sheet commands.
- Tests: Vitest for values, text placement, snapping, and detachment; Playwright for placing a dimension and a note, moving a dimension line, editing and deleting.
- Docs: the sheets page gains dimensions and notes sections.
- Ordering: `sheet-views` must be archived first; `sheet-isometric` follows this change.
