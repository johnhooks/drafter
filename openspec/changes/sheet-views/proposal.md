## Why

A model is worth little if it cannot leave the screen as a drawing someone can read from paper. This is the first of three changes that replace the single drawing-sheets proposal: it produces printable letter-size sheets from the bodies, each holding one orthographic view at a standard scale with a title block, and prints or exports them at true size. Annotations and the isometric view follow in their own changes, so this one lands a usable drawing early and keeps the one algorithmic risk, hidden-line projection, in a change small enough to test on its own.

## What Changes

- Drawing sheets in the document. A sheet is one letter page, portrait or landscape, holding one view, front, top, left, or right, of the whole model or one body, at a scale from 1:1, 1:2, 1:4, 1:8, 1:12, 1:16, 1:24. A document may have any number of sheets, kept in order and saved with the file, which moves to format version 6.
- Exact orthographic projection of bodies to 2D with visible and hidden edge segments. Hidden edges draw dashed. Coplanar neighbours draw as one outline. The projection also lists its vertices and segments, which the annotation change will use as snap targets.
- A title block on every sheet: document title, sheet name, view, scale, the date the document last changed, and sheet number of total.
- A persisted next-sheet-number counter keeps default names from being reused after deletion or reload.
- A Sheets mode beside the model and sketch views: a sheet list with add, rename, reorder, and delete with confirmation, a properties panel for the sheet's name, orientation, view, target, and scale with its warnings, and a page view with zoom, pan, and fit. The command table gains a sheet view so model and sketch keys do not fire there.
- Printing one sheet per page at true scale through the browser's print dialog, the current sheet or all of them, and SVG export of the current sheet.

Not in this change: dimensions, notes, or any annotation; the isometric view; section views; multiple views on one sheet; page sizes other than letter; DXF export.

## Capabilities

### New Capabilities
- `orthographic-projection`: projecting bodies to front, top, left, and right views with exact visible and hidden edge segments, plus vertex and segment lists.
- `drawing-sheets`: the sheet model: page, view, target, scale, title block, ordering, persistence, and following the model.
- `sheet-editor`: the Sheets mode: list, settings panel, navigation, and which commands apply.
- `sheet-print-export`: printing at true scale and SVG export per sheet.

### Modified Capabilities
- `document-file`: the file holds an optional ordered `sheets` list and moves to version 6; versions 1 to 5 load.
- `commands`: a command's view is model, sketch, sheet, or all; keys of another view do not fire in sheets mode.

## Impact

- Core: `src/core/projection/{frame,project,hidden}.ts` and `src/core/sheets/{types,layout,render,titleBlock,validate}.ts`, pure and unit tested; the document model, validator, and a version 6 migration.
- UI: a `sheet` mode in the store with pure actions for the sheet list; `src/ui/sheets/{SheetsMode,SheetList,SheetProperties,SheetView}.tsx`; a `sheet` value in `CommandView`; a print container and stylesheet.
- Tests: Vitest on projection with bodies from the modeller's own operations, sheet layout and rendering, migration; Playwright for the sheets mode scenarios and the export; print is checked by hand in print preview and recorded in the notes.
- Docs: a new drawings section with a sheets page, the file format page, the timeline page's mode list, and the tools-and-snapping key table.
- Ordering: `command-keys` introduces `commands` and must be archived first. `sheet-annotation-tools` and `sheet-isometric` build on this change and follow it.
