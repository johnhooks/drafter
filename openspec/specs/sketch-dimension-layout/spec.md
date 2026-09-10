# sketch-dimension-layout Specification

## Purpose
Lets the user put each dimension where it reads best, and gives sensible positions to the ones they never touch.

## Requirements

### Requirement: Placement is stored per dimension
Each line slot that is displayed as a dimension (a driving dimension for the position or a run end, or the length label of a free line) and each region label (width or height) MAY carry a placement: an offset in sixteenths measured continuously from the dimension's reference edge, positive away on its default side, zero on the edge, and negative through to the other side; and a label position as a fraction along the dimension line from 0 to 1. Extension lines SHALL run from whichever end is nearer the line. A missing placement SHALL mean automatic placement. Line placements SHALL be stored with the line; region label placements SHALL be stored in the sketch keyed by the region's corner lines. Placement SHALL be saved with the document and restored with it, SHALL be removed when the slot's constraint is removed or the line is deleted, and a region label placement whose region no longer exists SHALL be dropped on the next edit of the sketch.

#### Scenario: Placement survives reload
- **WHEN** the user drags `l1`'s position dimension 1" further out and reloads
- **THEN** the dimension is drawn at that offset

#### Scenario: Placement goes with the constraint
- **WHEN** the user removes the constraint on `l1`'s position after placing its dimension
- **THEN** the placement is no longer stored for that slot

#### Scenario: Region label placement survives a move
- **WHEN** the user drags a region's width label down 1" and then moves the region's right line
- **THEN** the label is still drawn 1" further down than its automatic position

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
Pressing on a dimension label and moving at least 3 px SHALL slide the label along the dimension line, committing the fraction on release. The label MAY be placed beyond the ends of the line, clamped to a fraction between -0.5 and 1.5, so a short dimension can carry its text outside its extension lines. A region label or a free line's length label has no separate line, so the first movement of a drag decides: mostly along its edge slides the label, mostly away from its edge moves it as a line does. A press without movement SHALL open the label for editing as it does today.

#### Scenario: Slide a label
- **WHEN** the user drags the label of the `2"` dimension to its right end
- **THEN** the label fraction is 1 and the text sits at the driven line

### Requirement: Automatic placement avoids the size labels
When a driving dimension has no placement, it SHALL be drawn on the side away from the region labels: a dimension across two vertical lines above the driven line's top end, a dimension across two horizontal lines left of the driven line's left end, each 22 px out; a dimension along a line's run on that line's default side 22 px out. A second driving dimension on the same axis of the same line SHALL be drawn 22 px further out than the first. Region labels SHALL sit below the region's bottom edge and right of its right edge; a free line's length label SHALL sit below a horizontal line or right of a vertical line.

#### Scenario: Two links on one axis stack
- **WHEN** vertical lines `l1` and `l2` bound a region and both are linked with no placement
- **THEN** both dimensions are above the region, the second one step further out, and neither overlaps the region's width label

### Requirement: Placement is undoable
Committing a drag SHALL be one undo entry.

#### Scenario: Undo a drag
- **WHEN** the user drags a dimension and presses Cmd+Z
- **THEN** the dimension returns to where it was
