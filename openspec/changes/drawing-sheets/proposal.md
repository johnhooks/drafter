## Why

The point of modelling the cabinets is to hand a builder drawings they can read from paper. `sketch-extrude-modeler` produces the solids; this change produces printable letter-size sheets from them, with hand-placed dimensions and notes, so the output is a drawing rather than a screenshot.

## What Changes

- Drawing sheets added to the document. A sheet is one letter page, portrait or landscape, holding one view: front, top, left, right, or isometric, of the whole model or one body, at a standard scale (1:1, 1:2, 1:4, 1:8, 1:12, 1:16, 1:24). A document may have any number of sheets.
- Orthographic projection of bodies to 2D with exact visible and hidden edges. Hidden edges draw dashed. The isometric view on a sheet is the same rendering as the 3D view, placed as a raster image; it cannot carry dimensions but can carry notes.
- Linear dimensions placed by hand: two snap points on the projected geometry and a position for the dimension line. Values are true model size regardless of scale, formatted as inches with fractions. Dimensions whose points no longer sit on geometry after a model edit are flagged.
- Notes: text placed anywhere on the sheet, optionally with a leader arrow to a point.
- Title block on every sheet: document title, sheet name, view, scale, date, sheet number of total.
- A sheet editor: sheet list, view settings, dimension and note tools with snapping, select and delete, zoom and pan.
- Printing: one sheet per page at true scale through the browser's print dialog, all sheets or the current one. SVG export per sheet.
- Sheets are stored in the document JSON alongside features. The format version stays 1; documents without sheets remain valid.

Not in this change: dimensions on isometric views, aligned or angular dimensions, section views, multiple views on one sheet, manual view placement on the page, DXF export, page sizes other than letter.

## Capabilities

### New Capabilities
- `orthographic-projection`: projecting bodies to front, top, left, and right 2D views with exact visible and hidden edge segments.
- `drawing-sheets`: the sheet model: page, view, scale, title block, ordering, persistence, and updating when the model changes.
- `sheet-annotations`: linear dimensions and notes on a sheet: definition, snapping targets, values, and detachment.
- `sheet-editor`: the sheet UI: sheet list, view settings, tools, selection, navigation.
- `sheet-print-export`: printing at true scale and SVG export.

### Modified Capabilities
None. `persistence-export` from `sketch-extrude-modeler` is not yet a main spec; sheet persistence is specified inside `drawing-sheets` and is compatible with that format.

## Impact

- Depends on `sketch-extrude-modeler` being implemented: bodies, faces, evaluation, the 3D view, the units module, the snapper list, and the tool state machine pattern are all reused.
- Adds a print stylesheet and a per-sheet SVG renderer. No new runtime dependencies.
