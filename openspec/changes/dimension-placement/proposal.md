## Why

Driving dimensions and the width and height labels are placed by a fixed rule: a set distance from the rectangle's edge, label at the midpoint. That rule collides with itself (the width label and a horizontal driving dimension share the space under the bottom edge) and runs long dimensions through neighbouring geometry. A drawing the user cannot tidy is awkward to read and impossible to present.

## What Changes

- Every dimension on a sketch, driving dimensions and the plain width and height labels, gets an optional placement: how far its line sits from the rectangle edge, on either side, and where its label sits along the line.
- With the Select tool, dragging a dimension line moves it perpendicular to itself; dragging a label slides it along the line. A press without movement keeps its current meaning: selecting the dimension, or opening the label for editing.
- Placement is stored in the document beside the slot it belongs to, so it saves, loads, and undoes like any edit, and disappears with its constraint.
- Better automatic placement when nothing has been dragged: driving dimensions sit on the opposite side of the rectangle from the size labels, and several dimensions on one axis stack outward instead of overlapping.
- The file format gains an optional field; version stays 2 and older files load unchanged.

Not in this change: placing dimensions on drawing sheets (that change carries its own placement), dimension text overrides, leader lines.

## Capabilities

### New Capabilities
- `sketch-dimension-layout`: stored placement for sketch dimensions and labels, the drag interactions that set it, defaults, and persistence.

### Modified Capabilities
- `sketch-link-tool`: the requirement that draws driving dimensions now says where they are drawn by default and that placement can be overridden.

## Impact

- Core: an optional `layout` per rectangle axis and slot in the document model and validation; `dimensionsOf` reads it.
- UI: a drag state in the sketch editor for dimension lines and labels; one new store action.
- Ordering: `sketch-constraints` must be archived before this change is archived, because it modifies `sketch-link-tool`.
