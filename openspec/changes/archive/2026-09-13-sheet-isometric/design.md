## Context

`sheet-views` renders a sheet as a pure SVG with a view group of projected segments; `sheet-annotation-tools` adds dimensions and notes to that SVG and refuses nothing by view kind. The 3D view is react-three-fiber with a camera the model view frames to the bodies. See proposal.md.

## Goals / Non-Goals

**Goals:**
- An isometric sheet that looks like the 3D view and prints at 300 DPI.
- A meaningful projected model-to-paper ratio instead of auto-fitting on every render.
- Stable annotation coordinates through a view choice committed at creation.
- No re-rendering while the user pans or zooms the sheet.

**Non-Goals:**
- Vector hidden-line isometric views; that needs general polygon clipping and is deferred.
- Dimensions on an isometric view.
- Model-space point picking and true-distance dimensions over the pictorial view are deferred to a later change. Do not infer measurements from raster pixels.
- Editing a committed view direction or capturing viewport pan and zoom.
- Free image positioning or a separate on-paper zoom control; ratios control size and the view remains centred.

## Decisions

**Commit the view at creation.** The creation flow chooses an orthographic direction or isometric before adding the sheet. Creation is one undo step; cancelling creates nothing. For isometric, copy azimuth and elevation from the current model camera when creation is confirmed. The settings panel displays the committed view instead of offering a view selector. Enforce the lock in store actions as well as the UI, even on sheets without annotations. Alternative: allowing changes until dimensions exist. Rejected because notes also belong to a particular view and the sheet should have one stable identity.

**Persist orientation, not the viewport.** Store finite camera azimuth and elevation on isometric sheets as document data, using the model camera's existing angular conventions. Do not store three.js objects, rendered pixels, pan, or zoom. Later model-camera movement must not alter an existing sheet. Existing orthographic sheets retain their stored direction and need no migration of annotations. Save/load and undo/redo preserve the captured orientation. Reject malformed isometric camera data on file validation.

**Isometric sheets embed a PNG at the selected ratio.** Use the captured orientation with an orthographic camera. At scale 1:n, the drawing area's paper width and height correspond to n times those lengths in model inches in the camera plane. Rasterize that fixed extent at 300 DPI and embed the PNG over the drawing area. Recentring follows the projected target bounds; do not change the ratio to fit. Both asynchronous preview/export and synchronous native print use the same camera extents. The isometric label describes the pictorial sheet kind; the camera is user-chosen, not restricted to a canonical isometric angle.

**Fit once, then preserve scale.** Compute projected target bounds using pure camera-basis maths, without introducing non-axis-aligned model geometry or a three.js dependency into core. At creation choose the largest existing standard ratio whose projected width and height fit the drawing area. Use 1:1 for an empty target; if no listed ratio fits, use 1:24 and warn. Model edits, target changes, and page orientation changes recalculate centring and overflow but retain the selected scale. Oversized views clip at the drawing area and warn just like other sheets. An edge parallel to the camera plane and 24 inches long occupies 6 inches on paper at 1:4; oblique edges remain foreshortened. Moving from 1:4 to 1:8 halves projected spans without changing the camera orientation.

**Use the existing persisted scale.** No extra zoom or placement field is needed. Existing isometric sheets keep their stored denominator, which now determines image size rather than being ignored. They may need a different ratio to fit; do not silently substitute one on load. Notes and their leaders retain paper positions when the ratio changes. Undo/redo and save/load preserve the selected ratio.

**Cache by all image inputs.** Memoise on target id, model evaluation identity/version, captured azimuth/elevation, scale denominator, and raster width/height. Two sheets with different captured orientations or scales must not share the wrong image. Viewport pan and zoom, live model-camera movement, annotation edits, and edits to other sheets do not re-render. Model, scale, target, and page orientation changes invalidate the appropriate captures while raster resolution stays at 300 DPI on paper.

**The image is the view group.** `renderSheet` accepts either segments or an image for its view group, so the title block, page frame, and notes are drawn by the same code. Notes on an isometric sheet place their leader endpoint in paper coordinates because there is no view geometry; the note type gains a paper-space leader variant.

**No annotation conversion.** Because view kind and direction cannot change after creation, there is no conversion between model-space and paper-space note leaders. Dimensions are rejected on isometric sheets by validation and actions; their toolbar button is disabled, D does nothing, and selecting an isometric sheet cancels an active dimension tool.

**Export embeds the data URL.** The exported SVG carries the image inline, so the file is standalone at the cost of size; a letter drawing area at 300 DPI is around six megapixels, acceptable for a per-sheet download.

**Native printing must capture synchronously.** Browser `beforeprint` cannot wait for the React scene commit. On a cache miss, build the same faces and edge geometry synchronously on the reused renderer, with the same framing, lighting, and materials. Cache that capture for subsequent screen and export use. App print commands can await raster preparation and image decoding before opening print preview.

## Risks / Trade-offs

- [A ratio may suggest every printed edge can be measured directly] → Document that the ratio applies to projected lengths; oblique edges remain foreshortened and true model-space dimensions remain deferred.
- [Off-screen render competes with the live 3D view for the GL context] → Render into a separate hidden canvas with its own renderer, sized once, reused across sheets.
- [Print of a large embedded raster is slow] → One image per isometric sheet at the drawing area's size; nothing larger.
- [A model edit moves geometry away from paper-space leaders] → Notes remain manually placed references, not geometry attachments; the fixed camera does not imply leaders track model edits.
