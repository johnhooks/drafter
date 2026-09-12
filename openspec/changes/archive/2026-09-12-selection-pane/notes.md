# Verification

Run on 2026-09-10 after all tasks, including the divider, accordion, minimize, and scroll cue.

- `pnpm test`: 28 files, 283 tests passed
- `pnpm test:e2e`: 30 passed, including the selection pane and divider tests in `tests/e2e/lines.spec.ts`
- `pnpm typecheck`: clean
- `pnpm build`: succeeds; the existing chunk size warning is unchanged
- `pnpm docs:build`: 20 pages built
- `openspec validate selection-pane --strict`: valid

## Review fixes, 2026-09-12

A code review of the working tree found six defects in the column; all fixed and covered by e2e steps in `tests/e2e/lines.spec.ts` and `tests/e2e/rectangles.spec.ts`. After the fixes: `pnpm test` 283, `pnpm test:e2e` 31, typecheck, build, and docs build clean.

- A stored pane height was applied unclamped on load and never re-clamped on resize, so the lists could collapse to nothing. The pane now shrinks and both it and the lists carry a 120 px floor in the stylesheet, so the layout holds the invariant on load and resize; the drag clamp measures the sketch panel instead of assuming 160 px, which was less than the panel's real height.
- The accordion's open list could unmount from under it (last rectangle exploded, last constraint removed), leaving every list collapsed. The shown list now falls back to Regions.
- Cancelling the pointer event stopped the divider taking focus on click, so the arrow keys did nothing after a drag; the handler focuses it explicitly, and `touch-action: none` keeps touch drags from being cancelled.
- The separator announced a pixel height with no range; the value is dropped rather than misreported.
- Minimizing the sketch window doubled the rule between title bar and lists; the lists' own border is gone.
- The divider e2e test runs at 700 px and drags 60 px so it stays under the real ceiling; it no longer focuses the divider by hand.

Left for a later pass: the accordion could use react-aria's `DisclosureGroup` through the kit instead of threaded state, and the column's stylesheet reaches into kit class names for minimize and fill behaviour the kit should expose.
