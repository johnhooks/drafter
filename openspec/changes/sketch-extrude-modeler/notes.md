# Integration walkthrough

Date: 2026-09-08

The carcass walkthrough from task 10.1 is automated in `tests/e2e/modeler.spec.ts`
and run with `pnpm test:e2e` (Playwright, headless Chromium with software GL).
Unit tests: `pnpm test` (Vitest, 114 tests on the core and store actions).

## What the walkthrough does

1. New sketch on XZ, drag a 24 x 24 rectangle, edit its width inline (invalid
   input keeps the editor open; Escape cancels), move it by typing in the panel.
2. Extrude to a 24" cube. Click the body to select it and its extrude.
3. Pick the top face, sketch a 4 x 4 rectangle on it (edge snap onto the face
   edge verified), Delete key removes a rectangle, cut a 2" pocket. Volume is
   24^3 - 32.
4. Pick the right face, sketch a 16 x 4 rectangle, join a 12" shelf. Bounds grow
   to x = 36".
5. Change Extrude 1 from 24" to 30". No errors; pocket and shelf follow.
   Volume is 24 * 24 * 30 - 32 + 16 * 4 * 12.
6. Reopen Sketch 2 from the timeline: rectangles and reference face present.
7. Export sketch SVG (standalone, has xmlns and title), reload restores the
   document, download JSON, export PNG.
8. Delete Extrude 1: confirmation lists Extrude 1, Sketch 2, Extrude 2,
   Sketch 3, Extrude 3; all removed.
9. Invalid JSON refused with a notice and the document unchanged; valid JSON
   replaces it; corrupt storage opens a new document with a notice; New
   document asks first.
10. Back-facing plane shows "X left" in the axis indicator and mirrors u.
11. Wheel zoom and middle-button pan change the view.

## Observations

- Inline dimension editing needed `preventDefault` on the label's pointerdown:
  the follow-on mousedown blurred the input that had just opened.
- React StrictMode ran the load effect twice in dev, producing a duplicate
  notice. The load is now guarded and identical notices are deduplicated.
- The r3f canvas reports 300 x 150 for a frame after switching modes; tests
  wait for the real size before computing click positions.
- Default extrude distance is 1" (the design's open question), editable at once
  because the distance field is focused when the extrude is created.
