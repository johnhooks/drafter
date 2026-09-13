# Verification

Verified on 2026-09-12:

- `pnpm test`: 409 tests passed across 36 files.
- `pnpm test:e2e`: 40 tests passed in Chromium with software GL.
- `pnpm kit:test`: 32 tests passed across 18 files.
- `pnpm typecheck`: passed.
- `pnpm build`: passed; existing large-bundle warning remains.
- `pnpm docs:build`: passed, 21 pages generated. Existing optional i18n, 404 content, and sitemap site-configuration warnings remain.
- `openspec validate sheet-annotation-tools --strict`: passed.
- `git diff --check`: passed.

Core tests cover optional annotation arrays, validation and JSON round trips, true dimension values across scale changes, small-span text placement, leaders, multiline spacing, detachment, and hidden-corner snapping. Tool and store tests cover placement states, cancellation, signed coordinates, note movement, single-step history, and command isolation.

Browser tests cover dimension placement and live preview, dragging and undo, typed editing, scale changes and persistence, note creation and cancellation, double-click editing, leader placement, deletion and restoration, annotated SVG export, and sheet key rebinding. Existing sheet printing, navigation, sketch tools, and shortcut dialog tests also pass.

Review fixes preserve blank note lines, suppress a cancelled pointer release, accept signed annotation coordinates, reserve fixed shortcut aliases during rebinding, and preserve SVG node identity across selection redraws so native double-click editing works.

The picking follow-up replaces group bounding-box hit testing with painted strokes and text. Its regression test selects and drags an inner dimension while an outer dimension encloses it. Confirmed dimension points and incident edges use a pointer-transparent, screen-only blue overlay; tests verify marker position, colour, lifecycle, and exclusion from SVG export and print output. Highlighted edges clip to the drawing area while point markers remain visible elsewhere on the page. Follow-up review found no further actionable defects.

All tasks are complete. The change remains uncommitted and unarchived.
