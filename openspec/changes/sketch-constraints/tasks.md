## 1. Expression language

- [x] 1.1 Implement the lexer (mixed fractions, decimals, `"` suffix, identifiers with dots, operators, parentheses) and verify a table-driven test including `2 1/4`, `2-1/4`, `3/4`, `r1.right`, `face.width`, and rejection of `2 1/4/3` and `@`
- [x] 1.2 Implement the parser to an AST with precedence and unary minus; verify tests for `(r1.width - 3/4) / 2`, `-ply`, and parse errors with positions
- [x] 1.3 Implement `Value` (length or axis-tagged position), `combine`, and `evaluate(ast, scope)` with rounding and division-by-zero; verify tests for every arithmetic rule in `sketch-expressions` including wrong-axis and position-minus-position

## 2. Slots, handles, parameters, migration

- [x] 2.1 Change `SketchRect` to per-axis slots with handle, add `params` to the document, and update validation for the two-driven invariant, handle uniqueness, and parameter names; verify tests for each validation error
- [x] 2.2 Implement `setSlot` with the keep order and refusal, plus `derive`; verify an exhaustive test over the nine driven-pair and edited-slot cases and the refusal case
- [x] 2.3 Implement `nextHandle` and use it for rectangles and sketches in the store actions; verify tests for `r4` after deleting `r2` and for sketch handles
- [x] 2.4 Implement parameter evaluation in list order, `renameParam` by token rewrite, and `usesOf(name)`; verify tests for parameter-from-parameter, rename round trip, and uses listing
- [x] 2.5 Implement version 1 to 2 migration in `parseDocument` and save as version 2; verify tests that the modeler change's sample documents load with handles assigned and identical evaluation

## 3. Resolution inside evaluate

- [x] 3.1 Implement `resolveSketch` with scope building (params, same-sketch rects, face), dependency ordering, cycle detection, size > 0 check; verify tests for later-rectangle reference, cycle naming both rects, inset follows face, parameter change, and unknown name
- [x] 3.2 Store resolved rects in `SketchResult`, make `applyExtrude` read them, and fail extrudes that reference a failed rectangle; verify tests for the blocked-extrude scenario and that all existing evaluate tests still pass
- [x] 3.3 Accept expressions for extrude distance and principal plane offset with a parameters-only scope; verify tests for extrude-by-parameter and an offset expression, and that a rectangle reference in a distance is an unknown name

## 4. Properties and parameters UI

- [x] 4.1 Extend `LengthField` into a `LenField` that accepts numbers or expressions, shows the expression with its value or error, and marks derived slots; verify manually that `face.left + 2` displays `face.left + 2` and `2"`
- [x] 4.2 Rewrite rectangle properties as min, max, size per axis with derived marking and refusal messages; verify manually against the four slot-edit scenarios in `sketch`
- [x] 4.3 Add the Parameters section to document properties: add, rename, change, delete with refusal listing uses; verify manually against the `document-parameters` scenarios
- [x] 4.4 Make extrude distance and plane offset fields expression-capable including the direction sign handling; verify manually that distance `ply` with direction "against" stores `-(ply)` and re-evaluates when `ply` changes

## 5. Sketch editor

- [x] 5.1 Add edge hit targets (`data-edge`) for rectangle and face edges and keep last-good rect positions in the store for error drawing; verify manually that a failed rectangle draws red dashed at its last position
- [x] 5.2 Implement the Link tool state machine with parallel check, sign choice, inline distance input, and refusal notices; verify manually against the three `sketch-link-tool` link scenarios
- [x] 5.3 Implement dimension graphics for simple links, expression tags for others, label editing that rewrites the literal, dimension selection and Delete, and a show/hide toggle; verify manually against the edit and remove scenarios
- [x] 5.4 Show rectangle handles in the rectangle list and sketch handles in the timeline; verify manually

## 6. End-to-end and integration

- [x] 6.1 Extend the Playwright suite: inset door via link tool on both sides, widen the carcass and confirm the door follows, parameter `ply` driving a shelf thickness, refusal when linking the width of a doubly-linked rectangle, version 1 file upload migrates; verify `pnpm test:e2e` passes
- [x] 6.2 Build a carcass with a door inset by `reveal` on all four sides and a shelf `ply` thick sitting `face.top - 12` from the top, change the carcass size and `ply`, and confirm everything follows; verify `pnpm test`, `pnpm test:e2e`, and `pnpm build` pass and record the result in a notes file in the change directory
