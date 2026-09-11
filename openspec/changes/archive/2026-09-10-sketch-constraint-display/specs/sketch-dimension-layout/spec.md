## MODIFIED Requirements

### Requirement: Placement is stored per dimension
Each line slot that is drawn as a constraint (the position or a run end) or as a size label (the length of a free line) and each region label (width or height) MAY carry a placement: an offset in sixteenths measured continuously from the reference edge, positive away on its default side, zero on the edge, and negative through to the other side; and a label position as a fraction along the measured line from 0 to 1. Extension lines SHALL run from whichever end is nearer the line. A missing placement SHALL mean automatic placement. Line placements SHALL be stored with the line; region label placements SHALL be stored in the sketch keyed by the region's corner lines. Placement SHALL be saved with the document and restored with it, SHALL be removed when the slot's constraint is removed or the line is deleted, and a region label placement whose region no longer exists SHALL be dropped on the next edit of the sketch. Placement SHALL apply whenever the constraint or label is drawn, whether by a toggle, by hover, or by selection.

#### Scenario: Placement survives reload
- **WHEN** the user drags `l1`'s position constraint 1" further out and reloads
- **THEN** the constraint is drawn at that offset

#### Scenario: Placement goes with the constraint
- **WHEN** the user removes the constraint on `l1`'s position after placing it
- **THEN** the placement is no longer stored for that slot

#### Scenario: Region label placement survives a move
- **WHEN** the user drags a region's width label down 1" and then moves the region's right line
- **THEN** the label is still drawn 1" further down than its automatic position

#### Scenario: Placement applies on hover
- **WHEN** the constraints toggle is off, `l1`'s constraint has a stored offset, and the pointer moves over `l1`
- **THEN** the constraint is drawn at the stored offset

### Requirement: Automatic placement avoids the size labels
When a constraint has no placement, it SHALL be drawn on the side away from the region labels: a constraint across two vertical lines above the driven line's top end, a constraint across two horizontal lines left of the driven line's left end, each 22 px out; a constraint along a line's run on that line's default side 22 px out. A second constraint on the same axis of the same line SHALL be drawn 22 px further out than the first. Region labels SHALL sit below the region's bottom edge and right of its right edge; a free line's length label SHALL sit below a horizontal line or right of a vertical line.

#### Scenario: Two links on one axis stack
- **WHEN** vertical lines `l1` and `l2` bound a region and both are linked with no placement
- **THEN** both constraints are above the region, the second one step further out, and neither overlaps the region's width label
