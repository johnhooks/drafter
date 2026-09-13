## Context

`sheet-views` renders a sheet as a pure SVG with a view group of projected segments; `sheet-annotation-tools` adds dimensions and notes to that SVG and refuses nothing by view kind. The 3D view is react-three-fiber with a camera the model view frames to the bodies. See proposal.md.

## Goals / Non-Goals

**Goals:**
- An isometric sheet that looks like the 3D view and prints at 300 DPI.
- No re-rendering while the user pans or zooms the sheet.

**Non-Goals:**
- Vector hidden-line isometric views; that needs general polygon clipping and is deferred.
- Dimensions on an isometric view.

## Decisions

**Isometric sheets embed a PNG.** On sheet render, the r3f scene is framed to the target's bounding box and rendered off-screen with `gl.render` on a hidden canvas at a pixel size equal to the drawing area at 300 DPI, then embedded as a data URL in an `<image>` element inside the view group. Alternative: a vector isometric projection. Deferred as above.

**Cache by target and model version.** The image is memoised on the target id and the evaluation's version, so pan and zoom on the sheet, and edits to other sheets, do not re-render. A model change invalidates every isometric sheet.

**The image is the view group.** `renderSheet` accepts either segments or an image for its view group, so the title block, page frame, and notes are drawn by the same code. Notes on an isometric sheet place their leader endpoint in paper coordinates because there is no view geometry; the note type gains a paper-space leader variant.

**Refusal, not deletion.** Changing a sheet that holds dimensions to isometric is refused with a toast naming the count, following the product's rule that refusals are toasts. The user deletes the dimensions first if that is what they want.

**Export embeds the data URL.** The exported SVG carries the image inline, so the file is standalone at the cost of size; a letter drawing area at 300 DPI is around three megapixels, acceptable for a per-sheet download.

## Risks / Trade-offs

- [Raster isometric looks different from vector views on the same document] → Accepted; iso sheets are for orientation, not measurement, and the title block says NTS.
- [Off-screen render competes with the live 3D view for the GL context] → Render into a separate hidden canvas with its own renderer, sized once, reused across sheets.
- [Print of a large embedded raster is slow] → One image per isometric sheet at the drawing area's size; nothing larger.
