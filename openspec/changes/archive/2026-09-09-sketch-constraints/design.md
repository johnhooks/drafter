## Context

Builds on `sketch-extrude-modeler`. Rectangles are stored as two corners, sketches are resolved inside `evaluate()` in timeline order, and extrudes read rectangle geometry through `normRect`. The store has pure actions over the document, the sketch editor has a tool interface with a shared preview path, and the properties panel already parses lengths through `LengthField`. This change threads expressions through those seams without changing the seams.

## Goals / Non-Goals

**Goals:**
- One expression evaluator shared by rectangle slots, parameters, extrude distance, and plane offset.
- Exact integer results, deterministic slot rules, no solver.
- A data model and resolver scope that cross-sketch references extend without migration.

**Non-Goals:**
- Any bidirectional or numeric constraint solving.
- References to other sketches (follow-up), to body geometry other than the sketch's face, or to sheets.
- Inferring constraints from snapping.

## Decisions

**Expressions are strings in the document, parsed on evaluation.** `src/core/expr/{lexer,parser,evaluate}.ts`: a hand-written tokenizer (numbers including mixed fractions, identifiers with dots, operators, parentheses) and a recursive-descent parser to a small AST. Parse errors are reported per slot. Alternative: store an AST. Rejected because strings are what the user types and reads, and re-parsing a few dozen short strings per evaluation is nothing.

**Values are `{ value: Sixteenths, kind: 'length' } | { value, kind: 'position', axis: 'x' | 'y' | 'z' }`.** Arithmetic rules from the spec live in one `combine(op, a, b)` function. The model axis, not u or v, is stored so the follow-up cross-sketch rule needs no change here.

**Scope is an explicit object.** `Scope = { params: Map<string, Value>, rects: Map<handle, ResolvedRectProps>, face?: ResolvedRectProps }`. The evaluator never reaches into the document. The follow-up adds `sketches: Map<handle, ...>` to the scope.

**Rectangle storage per axis.** `SketchRect = { id, handle, u: AxisSlots, v: AxisSlots }` with `AxisSlots = { min?: Len; max?: Len; size?: Len }` and `Len = number | string` where a string is an expression. Exactly two keys present is an invariant enforced by validation and by every action that edits slots. The slot-edit rule is one pure function `setSlot(axis, slot, value): AxisSlots | Refusal` with the keep order [edited, min, size, max], tested exhaustively over the nine (driven pair, edited slot) cases.

**Sketch resolution.** `resolveSketch(sketch, scope): { rects: Map<id, Rect2 & props>, errors: Map<id, string> }` builds a dependency graph from parsed references, topologically sorts it, evaluates slots, derives the third value, and validates size > 0. Cycles report every rectangle on the cycle. `evaluate()` stores resolved rects in `SketchResult.rects`; `applyExtrude` reads from there instead of `normRect`, so extrudes only ever see resolved geometry. A rectangle in error is absent from `rects`, and an extrude referencing it fails naming it.

**Last-good position for failed rectangles.** Kept in UI state, not the document: the store remembers the last resolved `Rect2` per rect id from the previous evaluation and the sketch editor draws failed rectangles from it in an error style. A freshly loaded document with a failing rectangle has no last-good and draws nothing for it.

**Parameters.** `doc.params: Array<{ name, value: Len }>` evaluated in list order with a scope of earlier parameters; a parameter referencing a later one is an unknown name. Rename rewrites expressions by re-tokenizing every expression in the document and replacing identifier tokens, which is exact and avoids regex pitfalls with prefixes. Delete checks the same token scan for uses.

**Extrude distance and plane offset as `Len`.** Both fields become `number | string`; the evaluator gets a scope of parameters only. The `distance` sign convention is unchanged: the resolved value's sign is the direction. The direction dropdown in the UI edits a sign that is applied to the resolved absolute value, so an expression `ply` plus direction "against" stores `-(ply)`. Stored as the expression string `-(ply)`, which round-trips.

**Handles.** `nextHandle(prefix, existing)` shared by rectangles and sketches. Sketch handles are assigned on creation and on migration; nothing references them yet.

**Link tool.** A third `Tool` with states idle, first edge chosen, anchor chosen and input open. Edge hit testing: each rectangle edge and each face edge is an SVG line with `data-edge="rectId:left"` or `data-edge="face:left"` and a wide transparent stroke for hit area. Parallel check is u versus v. The distance prompt reuses the inline input component; on commit the tool calls `setSlot` through the store and shows any refusal as a notice.

**Dimension graphics.** After resolution, for each driven slot whose AST is `Ref` or `Ref ± Literal`, the editor draws a dimension between the anchor coordinate and the driven coordinate at a fixed pixel offset from the rectangle, with a clickable label. Labels carry `data-dim-slot="rectId:u:min"` and inline editing writes the literal back keeping the reference and sign. Other expressions render as a tag with the text. Selection of a dimension is a `selection.constraint` entry; Delete replaces the slot with its resolved number.

**Migration.** `parseDocument` accepts version 1 and 2. Version 1 rectangles map to `{ u: { min, max }, v: { min, max } }`, handles assigned in order, `params: []`, then the result is validated as version 2. Save always writes version 2.

**Project layout additions.**
```
src/core/expr/{lexer,parser,evaluate,scope}.ts
src/core/model/slots.ts        setSlot, derive, axis invariants
src/core/model/params.ts       evaluate params, rename, uses
src/core/model/migrate.ts      v1 -> v2
src/core/eval/resolveSketch.ts
src/ui/sketch/tools/link.ts, src/ui/sketch/Dimensions.tsx
src/ui/Parameters.tsx
tests/core/expr/**, tests/core/slots.test.ts, tests/core/resolveSketch.test.ts, tests/core/migrate.test.ts
```

## Risks / Trade-offs

- [The slot-edit rule surprises someone who expected the far edge to stay put] → The rule is documented in the panel tooltip ("min is kept, then size, then max") and the derived field is visibly marked; one rule beats a modal question per edit.
- [Expressions typed with a wrong axis are a common first mistake] → The error message says which axis each side is and suggests `width`/`height` for lengths.
- [Renaming a parameter by token rewrite touches every expression string] → It is a pure function over the document with a round-trip test; unchanged expressions are returned as the same string.
- [Dimension graphics clutter a busy sketch] → Only simple links draw dimensions; a toggle in the sketch toolbar hides them.
- [Failed rectangles drawn from last-good state can mislead] → Error style is unmistakable (red dashed) and the panel lists the error; documents loaded with failures draw nothing for the failed rectangle.

## Open Questions

- Whether the dimension offset from the rectangle should be user-adjustable (drag the dimension line) or fixed. Fixed for now; adjustable is additive and does not change specs or tasks here.
