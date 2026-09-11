# Notes

## Verification

- `pnpm typecheck`, `pnpm build`, `pnpm docs:build`: clean.
- `pnpm test`: 279 tests, 27 files. New in `tests/ui/dimensions.test.ts`: a rectangle side anchors on its member line identically to naming the line, a rectangle middle anchors at the mean, a driven position ticks at the run midpoint with no tick on attached corners, a driven run end ticks at that end, a failed line has no tick, a middle anchor on an odd span rounds as the evaluator does, a rectangle with a missing member draws nothing and does not throw. New `tests/ui/persistDisplay.test.ts`: the constraints toggle loads, a stored `dims` is read as `constraints`, and the default applies when nothing is stored.
- `pnpm test:e2e`: 26 tests. New `constraintDisplay.spec.ts`: toggle off draws nothing and ticks each driven position at its midpoint with none on the corners; hovering a line draws its constraint in place of its tick and leaving hides it; selecting from the list draws and highlights it; a driven run end ticks at that end; toggle on draws everything and highlights the hovered line's own; a stored placement applies when shown by hover; a hover-shown constraint stays drawn through a drag, edits inline, selects, and deletes; the picked constraint is marked apart from its line's other highlighted ones; hovering or selecting a driven line lights its anchor edge and the toggle alone lights nothing; the list still removes a hidden one. The constraints and lines specs use the renamed toggle.

## Decisions made during implementation

- The rectangle anchor indexes the rectangle's validated member list directly. Middle anchors, for faces, lines, and rectangles, round to a whole sixteenth as the evaluator does, so an anchor on an odd span sits where the driven line resolves.
- Hover is held while a press is in progress. Pointer capture retargets moves to the svg during a drag, which otherwise cleared the hover and unmounted a hover-shown constraint mid-drag.
- Emphasis has two levels: the picked constraint is marked `data-dim-selected` with a wider stroke; a hovered or selected line's other constraints, with the toggle on, are marked `data-dim-highlight` only, so the one Delete acts on is always told apart.
- Anchor edges travel on each drawn constraint from the same lookup that gives its coordinate, so a face side, a line, a rectangle side, or both edges of a middle light without a second resolution. The overlay is translucent and unlabelled to stay apart from the link tool's solid labelled highlight.
- The sketch SVG export keeps the ticks. It is a working view, not a drawing; sheets are where a clean print comes from.
- Ticks are computed for every expression slot and dropped at draw time when the constraint is shown, so the on-demand rule lives in one place in the editor.
- The toolbar toggle's accessible name "Constraints" collides with the sketch properties' "Constraints" disclosure in Playwright's role query; the e2e steps use an exact match.
- The docs page `sketch/dimensions` keeps its slug and is retitled "Sizes and Editing" so existing links hold.
