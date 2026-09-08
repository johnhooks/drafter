## Purpose

Lets the user put each dimension where it reads best, and gives sensible positions to the ones they never touch.

## ADDED Requirements

### Requirement: Placement is stored per dimension
Each rectangle axis slot that is displayed as a dimension (a driving dimension for min or max, or the size label) MAY carry a placement: an offset in sixteenths measured continuously from the dimension's reference edge, positive away from the rectangle on its default side, zero on the edge, and negative through the rectangle's interior and out the other side; and a label position as a fraction along the dimension line from 0 to 1. Extension lines SHALL run from whichever rectangle edge is nearer the line. A missing placement SHALL mean automatic placement. Placement SHALL be saved with the document and restored with it, and SHALL be removed when the slot's constraint is removed or the rectangle is deleted.

#### Scenario: Placement survives reload
- **WHEN** the user drags `r1`'s left dimension 1" further out and reloads
- **THEN** the dimension is drawn at that offset

#### Scenario: Placement goes with the constraint
- **WHEN** the user removes the constraint on `r1`'s left after placing its dimension
- **THEN** the placement is no longer stored for that slot

### Requirement: Dragging moves a dimension line
With the Select tool, pressing on a dimension line and moving at least 3 px SHALL drag the line perpendicular to itself, updating the offset live and committing it on release as one undo step. The offset SHALL snap to whole sixteenths. The line MAY be placed anywhere along that axis, including between the edges it measures and beyond the far side of the rectangle.

#### Scenario: Drag a horizontal dimension up
- **WHEN** the user drags the `2"` dimension above `r1` 24 px further up at 12 px per inch
- **THEN** its stored offset grows by 2" and the line and its extension lines redraw there

#### Scenario: Place a dimension inside the rectangle
- **WHEN** the user drags a horizontal dimension down into the rectangle
- **THEN** it is drawn there, with extension lines from the nearer edge

#### Scenario: Click still selects
- **WHEN** the user presses on a dimension and releases without moving
- **THEN** the dimension is selected and no placement is stored

### Requirement: Dragging moves a label along its line
Pressing on a dimension label and moving at least 3 px SHALL slide the label along the dimension line, committing the fraction on release. The label MAY be placed beyond the ends of the line, clamped to a fraction between -0.5 and 1.5, so a short dimension can carry its text outside its extension lines. A size label has no separate line, so the first movement of a drag decides: mostly along its edge slides the label, mostly away from its edge moves it as a line does. A press without movement SHALL open the label for editing as it does today.

#### Scenario: Slide a label
- **WHEN** the user drags the label of the `2"` dimension to its right end
- **THEN** the label fraction is 1 and the text sits at the driven edge

### Requirement: Automatic placement avoids the size labels
When a driving dimension has no placement, it SHALL be drawn on the side of the rectangle opposite the size labels: horizontal driving dimensions above the top edge, vertical ones left of the left edge, each 22 px out. A second driving dimension on the same axis of the same rectangle SHALL be drawn 22 px further out than the first. Size labels SHALL keep their positions below the bottom edge and right of the right edge.

#### Scenario: Two links on one axis stack
- **WHEN** `r1` has both left and right linked and neither has a placement
- **THEN** both dimensions are above the rectangle, the second one step further out, and neither overlaps the width label

### Requirement: Placement is undoable
Committing a drag SHALL be one undo entry.

#### Scenario: Undo a drag
- **WHEN** the user drags a dimension and presses Cmd+Z
- **THEN** the dimension returns to where it was
