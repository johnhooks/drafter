## 1. Sheet rendering

- [x] 1.1 Add shared paper-space stroke constants and apply 0.50 mm to visible orthographic edges and 0.25 mm to hidden edges and annotation strokes; verify core tests for effective widths at 1:4 and 1:8, unchanged dashes, text and ticks, isometric note leaders, and unchanged raster geometry and page furniture.
- [x] 1.2 Add independent 1/16" extension gaps and retain 1/16" overruns after paper projection; update core endpoint assertions and test horizontal and vertical dimensions on both sides, points straddling the line, distances below/equal/above the gap, scale changes, and unchanged measurements and stored points.

## 2. Integration and documentation

- [x] 2.1 Add Playwright coverage for the visible/hidden/annotation hierarchy, dimension movement across points, gap omission, existing-document reload, and selection and warning colours; verify stroke widths and gaps agree in preview, exported SVG, app print, and native print and remain independent of model scale and viewport zoom.
- [x] 2.2 Inspect a representative sheet with hidden pocket edges, dimensions, a short dimension, and a leader at fit-to-page and print size; record visual verification of legibility and continued selection/dragging in the change notes.
- [x] 2.3 Update the drawing sheets guide with the line hierarchy and extension gaps; verify `pnpm docs:build`.
- [x] 2.4 Run `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, strict change validation, and diff checks; record results and confirm only presentation changes affect existing documents.
