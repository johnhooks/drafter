## Why

Laying out a run of kitchen cabinets for a builder needs only boxes, fronts, and dimensions, but general CAD tools make that slow and fiddly. A small browser app that draws a single wall run as dimensioned elevation, section, and isometric SVGs covers the real need with a fraction of the learning curve.

## What Changes

- New browser-only web app (no server) for describing one wall run of cabinets and rendering it as drawings.
- A document model for a wall run: wall size, shared defaults, a base row and an upper row of items (cabinets, appliances, fillers, empty space), and door/drawer fronts on cabinets.
- Exact fractional-inch handling: lengths are stored as whole sixteenths, entered and displayed as inches with fractions.
- A layout step that positions every item from its row order and the defaults, and reports warnings (run wider than wall, collisions, taller than ceiling) without blocking.
- Three views rendered as SVG: front elevation with automatic dimensions, side section with automatic dimensions, isometric without dimensions.
- An editor UI: item lists with add forms, a properties panel for the selected item, click-to-select in the drawing, and click-to-edit width and height dimension labels in the elevation.
- Autosave to browser storage, JSON download and upload, SVG export of the current view, and a print layout for PDF.

Explicitly not in this change: constraint expressions, alignment rules, drag interactions, multiple walls or corners, undo/redo, and construction detail such as panel thickness or joinery. Constraints are planned as a later change; the model stores plain numbers now so an expression can replace a number later without a migration.

## Capabilities

### New Capabilities
- `dimension-units`: parsing and formatting of lengths as inches with fractions, stored exactly as sixteenths.
- `run-document`: the wall run document: wall size, defaults, rows, item kinds and their fields, fronts, and validation of a document.
- `run-layout`: turning a document into positioned boxes, counter and toe kick segments, and layout warnings.
- `front-elevation-view`: the front elevation SVG including fronts, counter, toe kick, and automatic dimensions.
- `side-section-view`: the side section SVG through a chosen item, with automatic depth and height dimensions.
- `isometric-view`: the isometric SVG of the whole run.
- `editor-ui`: the browser editor: item lists, add forms, properties panel, selection, and inline dimension editing.
- `persistence-export`: autosave, JSON import/export, SVG export, and print output.

### Modified Capabilities
None. This is the first change in the project.

## Impact

- New codebase: Vite, TypeScript, Preact, Vitest. No backend, no network calls.
- Output artifacts are SVG files and a JSON document format that later changes must keep readable.
