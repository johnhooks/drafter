## Why

Rectangles today are fixed numbers. A door inset 1/8" inside a carcass, or a shelf 3/4" below a top, has to be re-typed whenever the thing it sits inside changes. Constraints let an edge be defined relative to another edge or to a named parameter, so the model keeps its intent when a dimension upstream changes.

## What Changes

- Each rectangle axis is defined by two of min, max, and size. Any of those slots may hold a plain length or an expression. The third is derived. Today's behaviour (two corners as numbers) is the default and needs no expressions.
- An expression language for lengths: literals in inches with fractions, `+ - * /` and parentheses, references to edges and sizes of rectangles in the same sketch by handle (`r1.right`, `r2.width`), to the face the sketch sits on (`face.left`, `face.width`), and to document parameters (`ply`).
- Document parameters: named lengths such as `ply = 3/4`, editable in one place, usable in rectangle slots, extrude distances, and principal plane offsets.
- Stable handles: rectangles get `r1`, `r2`; sketches get `s1`, `s2`. Handles are what expressions use; display names stay free text.
- A link tool in the sketch editor: click the edge to constrain, click the edge to measure from, type the distance. It writes the expression and draws a driving dimension between the two edges whose label edits the distance.
- Over-constraint handling: typing into a slot that would make three driven values drops the plain number that matters least; expressions are never dropped silently, and if both other slots are expressions the edit is refused with a message.
- Errors (unknown name, cycle, wrong axis, division by zero, non-positive size) mark the rectangle, are listed with the feature, and stop extrudes that depend on it, in the same way face reference errors do today.
- Document format version 2. Version 1 files load and are migrated on read.

Not in this change: references to rectangles in other sketches, constraints between a rectangle and body geometry that is not the sketch's own face, angular or equal-spacing constraints, inferring constraints from snaps, cross-sketch reference geometry.

The follow-up change for cross-sketch references is anticipated: handles exist for sketches from the start, the resolver takes a scope object that a later change extends with earlier sketches, and every resolved position carries its model axis so the "positions only from a parallel plane, lengths from anywhere" rule can be enforced without changing stored data.

## Capabilities

### New Capabilities
- `sketch-expressions`: the expression grammar, name resolution scope, axis rules, evaluation, and error reporting.
- `sketch-constraints`: the per-axis driven-slot model for rectangles, handles, over-constraint rules, derived values, and evaluation order within a sketch.
- `document-parameters`: named lengths on the document, their editing, and where they can be used.
- `sketch-link-tool`: the sketch editor tool that creates and edits edge-to-edge constraints, and the dimension graphics for them.

### Modified Capabilities
- `sketch`: rectangles are stored per axis as two driven slots instead of two corners; edits by size or position are restated in terms of slots.

## Impact

- Core: new `expr` module, a version 2 document format with migration, sketch resolution inside `evaluate`, and extrude reading resolved rectangles rather than raw corners.
- UI: rectangle properties accept expressions and show derived values, a third sketch tool, dimension graphics, and a parameters section in document properties.
- Ordering: `sketch-extrude-modeler` must be archived before this change is archived, because this change modifies its `sketch` capability.
- `drawing-sheets` is unaffected. Sheet dimensions measure; these constraints drive.
