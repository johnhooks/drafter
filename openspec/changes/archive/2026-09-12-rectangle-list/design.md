## Context

`SketchProperties` in `src/ui/Properties.tsx` renders one "Shapes" disclosure over the evaluated regions and names a row after a rectangle when `regionIsRectangle` matches; the rectangle form is rendered for a single selected member line or for a single selected region that matches a rectangle. Selection state holds `lineIds` and `regions` only. Four selected lines show a Make rectangle button regardless of whether they already form one. Selected lines are already highlighted in the sketch view. See proposal.md.

## Goals / Non-Goals

**Goals:**
- Every rectangle record has a row, and that row is a route to its form that does not depend on the regions inside it.
- No new selection kind and no new store action.

**Non-Goals:**
- Removing or collapsing any list.
- Canvas width and height labels for a rectangle.
- Changing what clicking inside a region selects.

## Decisions

**A rectangle row selects its four member lines.** Choosing a row dispatches the existing `selectLines` with the record's `lines`, and a row reads as selected when all four ids are in `selection.lineIds`. The view highlights them as it highlights any selected lines, Delete removes them under the existing line deletion rule, which dissolves the record, and undo works unchanged. Alternative: add `rectId` to `Selection` so a rectangle is selected as one thing. Rejected for now: it would need its own highlight, delete, and undo handling in the editor and the store for no behaviour the four lines do not already give. The proposal's non-goals record this so a later change can add it if a rectangle needs to be selected without its lines.

**Four member lines show the form, not Make rectangle.** The panel finds a rectangle whose `lines` equal the selected four as a set and renders `RectangleProperties` with that record; only when none matches does it offer Make rectangle. Without this, choosing a rectangle row would show the grouping button for a rectangle that already exists.

**Rectangles are listed from the record, regions from the result.** The rectangle list iterates `sketch.rects` in order and reads each member's resolved position from the sketch result to compute size and lower-left; a rectangle with an unresolved member is listed in the error tone with that member's error so it can still be selected and fixed. The region list keeps iterating the result's regions; the `regionIsRectangle` match moves from the row label into the detail as "fills r1".

**Order and titles.** Disclosures read Rectangles, Regions, Lines, then the existing constraint list; Rectangles and Regions are expanded by default as Shapes was, Lines stays collapsed. The Rectangles disclosure is hidden when the sketch has no records rather than showing an empty hint, since a sketch drawn with lines alone has nothing to say there.

**Accessible names.** The listboxes are labelled "Rectangles" and "Regions". The e2e helper steps that address the "Shapes" listbox change to "Regions".

## Risks / Trade-offs

- [Selecting a rectangle row selects lines, so shift-choosing two rectangles selects eight lines and shows no form] → Acceptable; the list is multi-select for symmetry with the others, and the eight lines are still a meaningful selection for Delete.
- [A user selects four lines of a rectangle by hand expecting Make rectangle and sees the form instead] → The form's title names the rectangle, which tells them it already exists.
