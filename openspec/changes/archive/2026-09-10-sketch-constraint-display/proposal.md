## Why

The sketch draws an expression-driven slot as a "driving dimension", with the look, the toggle name, and the stored placement of a drawing annotation, when it is a constraint: the visible form of `l1.at = face.left + 2`. Drawing sheets are about to introduce real dimensions, hand-placed on a projection for print, and the two must not share a word. Established sketchers keep them apart: the sketch shows its constraints, with a toggle and highlighting for the hovered or selected entity, and the drawing carries its own dimensions. Making the sketch say what it means now, before sheets land, keeps the vocabulary clean in the toolbar, the properties, the docs, and the file.

## What Changes

- The sketch's drawn relations are constraints, not dimensions. The toolbar toggle reads **Constraints**, on by default as today; the docs, tooltips, and spec text follow. The word "dimension" is reserved for sheet annotations.
- Constraints follow the on-demand rule that handles and sizes already follow. With the toggle off, the constraints of the hovered line and of every selected line are drawn, and a constraint selected from the sketch's list is drawn. With the toggle on, every constraint is drawn and those of the hovered or selected line are highlighted.
- A driven slot carries a resting cue when its constraint is not drawn: a short tick across the line in the constraint colour, at the midpoint for a driven position and at the driven end for a run end. Corner attachments and failed lines carry no tick.
- A constraint whose anchor is a rectangle property, such as `r1.right + 1`, is drawn as a measured constraint against the member line's edge, not degraded to a text tag.
- Placement, dragging, inline editing, and deletion of a drawn constraint are unchanged; they apply whenever the constraint is visible, however it came to be visible.

Not in this change: colouring lines by whether their slots are literals or expressions, showing corner attachments, any change to size labels, or dimensions on sheets.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sketch-editor`: the view's default content names constraints; the on-demand rule gains constraints for the hovered and selected line; the display toggle is Constraints with highlighting when on; the resting tick.
- `sketch-link-tool`: the drawn form of a simple link is a constraint, and its anchor may be a rectangle property.
- `sketch-dimension-layout`: placement applies to constraints and size labels; the text stops saying driving dimension.

## Impact

- UI: `Dimensions.tsx` gains a rectangle branch in the anchor lookup and a tick list; `SketchEditor` gates constraints per line by hover, selection, and the toggle instead of all-or-nothing, and draws the ticks; the `display.dims` preference becomes `display.constraints` with the old key migrated on load; the toolbar toggle's label and icon.
- Tests: e2e steps for the toggle off with hover and selection, the tick, the rectangle-anchored constraint, and the renamed toggle in the existing constraints and lines steps; a unit test for the rectangle anchor.
- Docs: tools-and-snapping's toggle table, link-tool's "Driving dimensions" section, and the sketch "Dimensions and Editing" page, which becomes "Sizes and Editing".
- Ordering: `sketch-rectangles` is archived; `command-keys` touches the toolbar and `sketch-editor` and must be archived before this change.
