## Why

Orthographic views measure; a pictorial view orients. A sheet that shows the model as the 3D view does, placed among the measured views, tells a reader what they are looking at. This is the last of three changes replacing the drawing-sheets proposal: it adds the isometric view kind as a raster of the 3D rendering, which can carry notes but not dimensions, and embeds it in print and export. It is separate because it is the only part that depends on off-screen rendering rather than exact geometry, and the drawings are complete without it.

## What Changes

- Choose front, top, left, right, or isometric when creating a sheet, then lock its view. An isometric sheet captures the current 3D camera orientation, persists it with the sheet, and shows the model from that orientation as a centred raster image at print resolution. Its editable scale uses the same ratios as other sheets and appears in the title block instead of NTS.
- Choose the largest listed scale that fits the captured projection on creation. Later model, target, and page edits preserve the selected ratio; oversized views warn and clip rather than auto-fit. The ratio controls projected size on paper, not the true length of a foreshortened edge.
- Existing sheets retain their current orthographic direction and become view-locked. Another direction requires another sheet, rather than moving existing annotations into a different projection.
- Notes are allowed on isometric sheets; dimensions are not, and the dimension tool is unavailable there.
- The SVG export of an isometric sheet embeds the raster image, so the file stays standalone.

Not in this change: vector hidden-line isometric views, dimensions on isometric views, changing a committed sheet's direction, capturing the model viewport's pan and zoom, or separate free placement and zoom controls for the image on paper.

Isometric dimensions are deferred, not permanently excluded. They require picking model-space points and measuring real geometry rather than distances in the foreshortened raster; this change does not add that machinery.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `drawing-sheets`: view selection is committed at creation; isometric sheets persist the current camera orientation and render at the selected scale ratio.
- `sheet-annotations`: dimensions are refused on isometric sheets; notes are allowed on every kind.
- `sheet-editor`: creation chooses the view and initial fitting scale; settings show the locked view and editable scale; the dimension tool remains disabled on isometric sheets.
- `sheet-print-export`: an exported isometric sheet embeds its raster.

## Impact

- UI: a creation flow that commits view selection and captures camera orientation; an off-screen react-three-fiber render at 300 DPI in `src/ui/sheets/isoRender.tsx`, cached by target, model version, captured orientation, scale, and raster size; `renderSheet` accepts an image for the view group.
- Persistence: store camera azimuth and elevation on isometric sheets and preserve them through save/load; existing orthographic sheets need no camera data.
- Tests: cover fixed views, camera capture and persistence, ratio-controlled image size and cache invalidation, initial fitting scale, overflow warnings, disabled dimensions, paper-space notes, and scaled print/export.
- Docs: sheets creation and view rules, file format, and export.
- Ordering: `sheet-views` and `sheet-annotation-tools` must be archived first.
