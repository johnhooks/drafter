# Integration walkthrough

Date: 2026-09-08

`tests/core/integration.test.ts` builds a base cabinet entirely from parameters and
constraints: carcass width, depth, and height by parameter; a door inset by `reveal`
on all four sides of the front face; a shelf `ply` thick at `face.top - 12` extruded
back through the carcass by `-(width)`. Changing `width` 30 to 36 and `ply` 3/4 to
1/2 moves the door edges and thins the door and shelf with no errors.

`tests/e2e/constraints.spec.ts` covers the interactive side: linking both edges of
a pocket to the face with the Link tool, the refusal when the width of a doubly
linked rectangle is typed, editing a driving dimension's literal, deleting a
dimension (the slot freezes to its value), hiding dimensions, parameters driving
extrude distance and rectangle size, rename rewriting references, delete refused
while in use, and a version 1 file migrating on upload.

Verification: `pnpm test` (185 tests), `pnpm test:e2e` (6 tests), `pnpm typecheck`,
`pnpm build`.

## Observations

- The slot-edit rule is visible in practice: linking a rectangle's left edge keeps
  its width, so the right edge moves. The e2e test had to click the new right
  edge position. This matches the spec and reads naturally once you know it.
- Playwright cannot click a zero-height SVG line ("not visible"), so tests select
  a dimension through its label, which now selects as well as opens the editor.
- `Len` is unbranded (`number | string`) so slot literals are easy to write; the
  resolved values keep the `Sixteenths` brand.
- Positions carry the model axis, and `resolveSketch` takes a scope object, as the
  proposal required for the cross-sketch follow-up.
