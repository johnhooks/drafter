## 1. Properties panel

- [x] 1.1 Add a Rectangles disclosure first in `SketchProperties`, one row per record in sketch order reading `<handle> <width> x <height>` with lower-left position and member handles as detail, error tone with the member's message when a member is unresolved, hidden when the sketch has no records; choosing rows dispatches `selectLines` with the members and a row reads selected while all four members are selected; verify by opening a sketch with a rectangle and a splitting line and seeing the rectangle row with the Rectangles listbox
- [x] 1.2 Rename the Shapes disclosure and listbox to Regions, label every row "Region" with its size, and move the rectangle match into the detail as "fills r1"; verify the region list of a whole rectangle shows one row naming `r1` in its detail
- [x] 1.3 When exactly four lines are selected and a record's members equal them as a set, render that rectangle's form and not Make rectangle; verify selecting `r1`'s four lines in the view shows "Rectangle r1" and no Make rectangle button, and four loose lines still show the button

## 2. Tests

- [x] 2.1 Update the "Shapes" listbox references in `tests/e2e/lines.spec.ts` to "Regions" and verify the affected test passes
- [x] 2.2 Add steps to `tests/e2e/rectangles.spec.ts`: after drawing `r1` the Rectangles list has "r1 24" x 16"" and the Regions list one "Region" row naming `r1`; after a line splits it the rectangle row remains and the two region rows name no rectangle; choosing the rectangle row selects its four lines in the debug state, highlights them, shows the form, and typing a Width moves the right line while the splitting line stays attached; verify with `pnpm test:e2e`

## 3. Docs and wrap up

- [x] 3.1 Update the properties panel and rectangle form sections of `docs/src/content/docs/sketch/dimensions.md` to describe the Rectangles and Regions lists and the four-lines route to the form; verify `pnpm docs:build`
- [x] 3.2 Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, and `pnpm docs:build` pass and record the results in a notes file in the change directory
