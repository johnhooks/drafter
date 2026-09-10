# Notes

Date: 2026-09-08

Dimensions and size labels carry an optional placement on the rectangle. The
offset is a continuous coordinate from the dimension's reference edge, so a line
can be dragged through the rectangle's interior and out the far side without a
jump; extension lines come from the nearer edge. Labels slide along their line by
fraction. A size label, which has no separate line, decides on the first movement
of a drag whether it slides or moves away.

Verification: `pnpm test` (202), `pnpm test:e2e` (9 tests, including
`placement.spec.ts`), `pnpm typecheck`, `pnpm build`, `pnpm docs:build`.

## Observations

- The first cut measured offsets outward from each side, which made the interior
  unreachable and produced a jarring side-to-side jump while dragging. Reviewed
  live; replaced with the continuous offset before finishing.
- SVG text only receives pointer events where glyphs are painted, so a press
  between characters fell through; every label now has an invisible hit
  rectangle behind it, sized to stay clear of the dimension line.
- The tool object must not depend on the dimension specs, because the live drag
  preview changes them and would recreate the tool mid-drag. The tool host reads
  the latest specs through a ref.
- Cursors: resize cursors on lines in the direction they move, grab on labels.
