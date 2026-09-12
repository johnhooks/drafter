## Why

The sketch properties list regions as "shapes" and name a row after a rectangle only when one region fills the rectangle exactly. As soon as a line crosses a rectangle, its row disappears and two "Region" rows take its place, even though the record and its form are intact. In a real drawing most rectangles are subdivided, so most rectangles are missing from the list and the form is reachable only by knowing to click a side.

## What Changes

- The sketch properties gain a **Rectangles** list, first among the lists, with one row per rectangle record whether or not anything splits it: its handle and size, its position and member lines as detail. Choosing a row selects the rectangle's four sides, which highlight in the view, and shows its form.
- Four selected lines that are exactly a rectangle's members show that rectangle's form; Make rectangle appears only for four lines that are not already one.
- The **Shapes** list becomes **Regions**. Every row reads "Region" with its size and bounding lines; a region that fills a rectangle says so in its detail. Selecting a region in the list or the view and the form it opens are unchanged.
- The Lines, Constraints, and Warnings lists are unchanged.
- The sketch documentation describes both lists.

Not in this change: removing any list, canvas labels for a rectangle's width and height, or a rectangle in the selection state distinct from its lines.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sketch-editor`: the shape list is replaced by a rectangle list and a region list.
- `sketch-rectangles`: the rectangle form opens from the rectangle list and from its four selected member lines.

## Impact

- UI: `SketchProperties` in `src/ui/Properties.tsx` gains the Rectangles disclosure and renames Shapes; the Make rectangle branch checks for an existing record first. No store action changes: choosing a rectangle row dispatches the existing `selectLines`.
- Tests: `tests/e2e/lines.spec.ts` references the "Shapes" listbox by name; `tests/e2e/rectangles.spec.ts` gains steps for the rectangle row surviving a split and opening the form.
- Docs: `docs/src/content/docs/sketch/dimensions.md`, the properties panel and rectangle form sections.
