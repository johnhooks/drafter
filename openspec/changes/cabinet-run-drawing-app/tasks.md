## 1. Project setup

- [ ] 1.1 Scaffold Vite + Preact + TypeScript in the repo root with strict TS, add Vitest, and verify `npm run dev`, `npm run build`, and `npm test` all run (test run may be empty)
- [ ] 1.2 Create the `src/core` and `src/ui` directory structure from design.md and add an ESLint rule or test that fails if anything under `src/core` imports `preact` or references `document`/`window`; verify the check runs in `npm test`

## 2. Units

- [ ] 2.1 Implement `parseLength` in `src/core/units.ts` covering every accepted form and every rejection in `dimension-units`; verify with a table-driven Vitest test including `35 1/4`, `35-1/4`, `3/4`, `35.3`, `24"`, `24 in`, `abc`, `-12`, `1/0`, empty
- [ ] 2.2 Implement `formatLength` with reduced fractions; verify tests for `35 1/2"`, `24"`, `3/4"`, `0"`, and `35 5/16"`

## 3. Document model

- [ ] 3.1 Define document, row, item, front types and the `Sixteenths` brand in `src/core/model/types.ts`; verify it compiles and a `newDocument()` matches the defaults scenario in `run-document`
- [ ] 3.2 Implement item factories (base, upper, tall, appliance by type, filler, space) with the default fronts and appliance defaults from `run-document`; verify tests for each factory including the width-dependent single/double door rule
- [ ] 3.3 Implement `validateDocument` returning `{ path, message }[]` covering wrong kind for row, zero width, fronts exceeding height, and duplicate ids; verify tests produce one error per problem and multiple errors together
- [ ] 3.4 Implement `resolveDefaults(doc, item)` giving height, depth, and upper bottom with override precedence; verify tests for the two override scenarios in `run-document` and the 54" default upper bottom

## 4. Layout

- [ ] 4.1 Implement `resolveFronts` in `src/core/layout/fronts.ts`; verify tests for reveal spacing, last front fills, double door split, and empty fronts
- [ ] 4.2 Implement row positioning and vertical/depth placement in `layout.ts` producing boxes; verify tests for the space offset, tall on floor, and upper over base scenarios in `run-layout`
- [ ] 4.3 Implement counter and toe kick segment generation; verify tests for range interrupt, dishwasher run-over, tall interrupt, and the toe kick recess scenario
- [ ] 4.4 Implement layout warnings (row wider than wall, upper collides with tall/appliance, above ceiling, upper below counter); verify tests for each with messages naming the items
- [ ] 4.5 Verify that `layout` on a document with validation errors still returns boxes using last valid values (test: zero-width item is skipped with a warning, others lay out)

## 5. SVG helpers and elevation view

- [ ] 5.1 Write `src/core/views/svg.ts` (element builders, attribute escaping, y-flip wrapper, embedded style block, `vector-effect`) and `dimensions.ts` (chain and single dimension with ticks and label); verify unit tests for escaping and a snapshot of one chain dimension
- [ ] 5.2 Implement `elevation(layoutResult, doc)` drawing wall, floor, ceiling, boxes, fronts, appliances with labels, counters, toe kicks; verify a snapshot test for a run of base, dishwasher, range, base with uppers and assertions that each `data-item-id` appears
- [ ] 5.3 Add width chains, overall width, and right-side height dimensions with omission rules; verify tests assert the label set from the two dimension scenarios in `front-elevation-view` and that `data-dim` attributes are present on width, height, and wall labels

## 6. Section and isometric views

- [ ] 6.1 Implement `section(layoutResult, doc, x)` with filtering by x and the automatic dimensions; verify tests for the through-base-and-upper scenario (label set) and the empty-space scenario
- [ ] 6.2 Implement the isometric projection and painter's sort in `isometric.ts` and draw top/front/left faces for boxes, counters, toe kicks, with fronts and labels on front faces; verify a snapshot test and a test that the base's front face element is emitted after the upper's faces

## 7. Editor UI

- [ ] 7.1 Implement the store (`useReducer`, actions: set document field, set default, add/remove/move item, set item field, set fronts, select, set view) in `src/ui/store.ts`; verify reducer unit tests for add, move, remove clearing selection, and set-field
- [ ] 7.2 Build `App` layout with row panel, drawing area with view tabs, properties panel, and warnings list; verify by running the dev server and seeing a new document render the empty wall in all three tabs
- [ ] 7.3 Build `RowList` and `AddItemForm` with kind options per row, move left/right and remove; verify manually against the add and move scenarios in `editor-ui`
- [ ] 7.4 Build `Properties` for document settings (nothing selected) and for each item kind, including the fronts list editor, length field validation, and blank-means-default placeholders; verify manually against the invalid width and clearing override scenarios
- [ ] 7.5 Build `Drawing` with event delegation for click-to-select and clear-on-empty, highlighting the selected item; verify manually in elevation and isometric
- [ ] 7.6 Build `InlineEdit` for width, height, and wall labels with Enter/blur commit, Escape cancel, and inline error; verify manually against the two inline scenarios and that editing a defaulted height sets an override

## 8. Persistence and export

- [ ] 8.1 Implement `persist.ts`: save on every doc change, load on start with validation, corrupt-storage notice, and "New document" with confirmation; verify manually via reload and by writing junk into the storage key
- [ ] 8.2 Implement JSON download and upload with `version: 1` and validation on upload; verify a Vitest round-trip test on serialise/parse and a manual test that an invalid file is refused with listed errors
- [ ] 8.3 Implement SVG export of the current view with the title embedded; verify by exporting each view and opening the file directly in a browser
- [ ] 8.4 Add `print.css` hiding panels and scaling the drawing; verify with print preview for each view

## 9. Integration check

- [ ] 9.1 Build a sample kitchen wall (sink base, dishwasher, range with hood gap above, refrigerator, uppers with a filler) and walk every scenario in the eight specs manually, fixing anything that fails; verify `npm test` and `npm run build` pass and record the walkthrough result in the change's proposal or a short notes file
