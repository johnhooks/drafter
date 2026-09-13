## Ratio verification

Verified on 2026-09-13:

- `pnpm test`: 441 tests passed in 41 files.
- `pnpm test:e2e`: 46 tests passed in Chromium with software GL.
- `pnpm typecheck`: passed.
- `pnpm build`: passed; existing large-bundle warning remains.
- `pnpm docs:build`: passed, 21 pages. Existing missing optional i18n/404 content and sitemap site-configuration warnings remain.
- `openspec validate sheet-isometric --strict`: passed.
- `git diff --check`: passed.

Coverage includes captured camera persistence and view locking, creation cancellation and undo/redo, 300-DPI image sizes, cache reuse and invalidation, model edits, dimension restrictions, paper-space notes and leaders, standalone SVG export, and native printing before the preview is ready.

Ratio-specific coverage verifies a camera-parallel 24" edge occupies 6" at 1:4 and 3" at 1:8 in preview, standalone SVG, app print, and cold-cache native print. Browser tests measure the embedded PNG's opaque span as 1800 and 900 pixels at 300 DPI. Oblique edges remain foreshortened. Pure projection tests cover disjoint-box centring and exact cardinal-angle fits.

Creation chooses the largest fitting standard ratio from captured projection bounds; empty targets use 1:1 and targets exceeding every ratio use 1:24 with a warning. Scale changes invalidate the image cache, while viewport navigation and annotation edits do not. Model, target, and page edits retain the ratio; oversized images warn and clip. Notes and leader endpoints retain their paper coordinates. Undo/redo and reload preserve the ratio without refitting.

The first full browser run caught an ambiguous test selector matching 1:1, 1:12, and 1:16. The selector now matches exactly; the focused rerun and the subsequent full suite passed.

## Earlier auto-fit verification

The earlier implementation passed 432 unit tests and 44 browser tests. Those results covered auto-fit rendering and NTS labels, not ratio-controlled sizing. The ratio-specific results above supersede them.

## Review adjustments

- Apply dimension availability to the toolbar as well as commands and store actions.
- Reset the dimension tool when deleting an orthographic sheet selects an isometric sheet.
- Capture uncached native print images synchronously using shared face geometry, colours, and the existing hidden renderer. The browser's beforeprint event cannot await a React scene commit. The regression test reproduces printing immediately after creation.
- Keep each sheet's camera independent of the live model camera. Isometric dimensions remain deferred because they need model-space picking and true geometry measurements.
