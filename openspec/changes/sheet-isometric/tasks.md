## 1. Rendering

- [ ] 1.1 Implement off-screen framed rendering of the 3D view at 300 DPI for a target on a hidden canvas, cached by target and model version; verify a test that the produced image size matches the drawing area at 300 DPI and that a second render with the same target and version reuses the cache
- [ ] 1.2 Let `renderSheet` take an image for the view group and read NTS in the title block for an isometric sheet; verify a test that an isometric sheet's SVG contains an image element and the title block reads NTS

## 2. Editor rules

- [ ] 2.1 Add isometric to the view kinds, disable the scale field for it, refuse the change when the sheet holds dimensions with a toast naming the count, and make the dimension tool unavailable on isometric sheets; verify e2e that switching to isometric disables scale and the Dimension button, that D does nothing there, and that a sheet with two dimensions refuses the switch with a message
- [ ] 2.2 Allow notes on isometric sheets with a paper-space leader; verify e2e that a note placed on an isometric sheet appears at the click position

## 3. Export, docs, wrap up

- [ ] 3.1 Embed the raster as a data URL in the exported SVG of an isometric sheet; verify e2e that the download contains an image element with a data URL
- [ ] 3.2 Update the sheets docs page's view section for the isometric kind and its rules; verify `pnpm docs:build`
- [ ] 3.3 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file in the change directory
