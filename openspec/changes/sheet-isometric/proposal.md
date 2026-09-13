## Why

Orthographic views measure; a pictorial view orients. A sheet that shows the model as the 3D view does, placed among the measured views, tells a reader what they are looking at. This is the last of three changes replacing the drawing-sheets proposal: it adds the isometric view kind as a raster of the 3D rendering, which can carry notes but not dimensions, and embeds it in print and export. It is separate because it is the only part that depends on off-screen rendering rather than exact geometry, and the drawings are complete without it.

## What Changes

- A sheet's view kind gains isometric. An isometric sheet shows the same rendering as the 3D view, framed to the target, as a raster image at print resolution, and its title block reads NTS in place of a scale; the scale selector is disabled.
- Notes are allowed on isometric sheets; dimensions are not, and the dimension tool is unavailable there.
- The SVG export of an isometric sheet embeds the raster image, so the file stays standalone.

Not in this change: vector hidden-line isometric views, dimensions on isometric views, a choice of isometric direction.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `drawing-sheets`: the view kinds include isometric; isometric sheets render from the 3D view and show NTS.
- `sheet-annotations`: dimensions are refused on isometric sheets; notes are allowed on every kind.
- `sheet-editor`: the dimension tool is unavailable on an isometric sheet; the settings panel disables scale for one.
- `sheet-print-export`: an exported isometric sheet embeds its raster.

## Impact

- UI: an off-screen react-three-fiber render of the target at 300 DPI for the drawing area, cached by target and model version, in `src/ui/sheets/isoRender.ts`; `renderSheet` accepts an image for the view group.
- Tests: Vitest that the produced image size matches the drawing area at 300 DPI and that the title block reads NTS; Playwright that switching a sheet to isometric disables scale and the dimension tool, and that the export contains an embedded image.
- Docs: the sheets page's view section.
- Ordering: `sheet-views` and `sheet-annotation-tools` must be archived first.
