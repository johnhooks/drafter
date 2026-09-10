# Notes

## Verification

- `pnpm typecheck`: clean.
- `pnpm test`: 24 files, 248 tests pass. New: `tests/core/regions.test.ts`, `tests/core/devfile.test.ts`, `tests/core/fixtures.ts`; rewritten: resolveSketch, sketch, evaluate, integration, migrate, pick, planes, params, expr evaluate, store actions, undo, dimensions, snap.
- `pnpm test:e2e`: 19 tests pass in about a minute. New `tests/e2e/lines.spec.ts` covers the Line tool, attachment, splitting, region selection, construction, the region list, extruding halves to different depths, and snapping onto a face edge. The Playwright config now runs one worker: with several browsers on software GL the PNG export in the modeler spec starved and timed out.
- `pnpm build` and `pnpm docs:build`: clean.

## Development file migration

`tests/core/fixtures/dev-cabinets.v2.json` is the version 2 development file. It loads through 2 to 3 to 4 and evaluates to the same bodies as before for every extrude except Extrude 2, exactly as the design predicted:

- Rectangle r13 (`r4.left + 3` to `r6.left - 2`, `826` to `r4.top - 2`) lies inside r4 and shares its bottom line. Under lines it splits r4 into a U-shaped ring and the inner rectangle. Extrude 2 references r4's corner region, which is the ring, so the body has an opening where r13 is. The inner region exists (152 by 477 sixteenths) and can be added back in the app: edit the sketch, select the inner region, and shift-click it into Extrude 2, or extrude it separately. Extrude 7 already had no target before migration and still reports that error.
- Adjacent rectangles (r2 above r3, the r6, r8, r9 group) share coincident lines. Region references stay valid because a reference matches any line covering the corner, not only the first in sketch order.

## Decisions made during implementation

- Region references resolve against every line covering the corner's two edges, not only the first in sketch order (`SketchRegion.corner`). Without this, two rectangles sharing an edge would give the second one a reference naming the first one's line, and the migration's `{left, bottom}` reference for the second rectangle would not resolve.
- `addLine` also attaches plain-number endpoints of existing perpendicular lines that lie on the new line, so a chain of four lines closes into a fully attached rectangle. Recorded in the `sketch-editor` delta spec.
- The selection is reconciled on every document change, not only on undo and redo, so deleting a line or opening a loop drops the stale selection at once.
- A side face reference is resolved through the region's current boundary; when several coincident lines cover an edge the boundary names the first in sketch order, and a reference to another one of them fails. Acceptable for now; noted in case it bites.
- Handles for lines run `l1`, `l2`, and so on per sketch; the migration numbers them in rectangle order (left, bottom, right, top).
