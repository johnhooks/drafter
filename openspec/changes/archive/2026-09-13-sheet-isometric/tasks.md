## 1. Rendering

- [x] 1.1 Add persisted isometric camera azimuth/elevation and paper-space note leaders to the sheet model and validation; verify save/load round trips, malformed camera and forbidden dimension rejection, and unchanged loading of existing orthographic sheets
- [x] 1.2 Replace auto-fit camera zoom with ratio-controlled orthographic extents in both asynchronous and synchronous captures, and include scale in the image cache key; add pure projected bounds for centring, initial scale choice, and overflow warnings; verify a camera-parallel 24" edge occupies 6" at 1:4 and 3" at 1:8, oblique edges remain foreshortened, raster resolution stays 300 DPI, scale invalidates the cache, and viewport navigation and annotation edits do not
- [x] 1.3 Render the selected ratio instead of NTS in the isometric title block and list; verify tests for both ratios and absence of NTS while retaining the embedded image

## 2. Editor rules

- [x] 2.1 Keep view selection and camera capture at creation, but choose the largest listed scale fitting the captured projection; verify creation/cancellation and locked views still work, empty targets default to 1:1, targets exceeding every ratio default to 1:24 with a warning, and initial scale and captured orientation survive undo/redo
- [x] 2.2 Enable the isometric scale selector while keeping dimensions unavailable; verify e2e ratio changes resize the model on paper, preserve note/leader positions, and survive undo/redo and save/load; verify existing stored ratios are applied without refitting, model/target/page edits preserve ratio and warn/clip when oversized, D remains unavailable, and later model-camera movement does not change the sheet
- [x] 2.3 Allow notes on isometric sheets with paper-space leaders; verify placement at the click position, leader creation and typed editing, and save/load preservation without projection snapping

## 3. Export, docs, wrap up

- [x] 3.1 Preserve the selected ratio in standalone raster SVG export, app printing, and native browser printing; verify e2e embedded data URLs, a camera-parallel 24" edge occupying 6" at 1:4, and cold-cache native printing with no auto-fit or viewport zoom applied
- [x] 3.2 Update sheets, file format, architecture, and export documentation to replace NTS and disabled-scale guidance with projected ratios, initial fitting scale, preserved scale and overflow, and unchanged paper-space leaders; explain foreshortening without implying true isometric dimensions are available; verify `pnpm docs:build`
- [x] 3.3 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and update the change's notes with ratio-specific results, distinguishing them from verification of the earlier auto-fit implementation
