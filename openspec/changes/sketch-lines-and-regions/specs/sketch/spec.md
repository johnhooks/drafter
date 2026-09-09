## MODIFIED Requirements

### Requirement: A sketch belongs to one plane
A sketch SHALL have an id, a handle, a name, a plane definition per `sketch-planes`, and an ordered list of lines. The plane SHALL NOT change after creation.

#### Scenario: New sketch
- **WHEN** a sketch is created on XY at offset 0
- **THEN** it has no lines and its plane is XY at offset 0

## ADDED Requirements

### Requirement: Lines in plane coordinates
A line SHALL have an id, a handle, a direction of horizontal or vertical, a position slot on the axis it crosses (v for a horizontal line, u for a vertical line), and on the axis it runs along exactly two driven slots among min, max, and size, with the third derived. Every slot SHALL hold a length in sixteenths or an expression per `sketch-expressions`. The resolved size SHALL be greater than zero. Lines MAY overlap, cross, and touch each other.

#### Scenario: Horizontal line
- **WHEN** a horizontal line has position 16, run min 2 and run max 26 as numbers
- **THEN** it runs from (2, 16) to (26, 16) and its length is 24

#### Scenario: Derived size
- **WHEN** a line's run has min 2 and max 26 driven
- **THEN** its size is derived as 24 and is not stored

#### Scenario: Zero-length line rejected
- **WHEN** a line's run resolves to min equal to max
- **THEN** the line is marked with an error

### Requirement: Line edits by slot
Setting a line's position SHALL replace that slot with the given value. Setting a run slot SHALL make that slot driven and keep exactly two driven run slots: the edited slot and the remaining slots in the order min, size, max, dropping the first plain number outside that pair; a slot holding an expression SHALL never be dropped. If keeping the edited slot would require dropping an expression, the edit SHALL be refused with a message naming the expressions.

#### Scenario: Set length keeps the min end
- **WHEN** a line's run has min 4 and max 14 driven and its length is set to 12
- **THEN** min 4 and size 12 are driven, max is derived as 16

#### Scenario: Set position moves the whole line
- **WHEN** a horizontal line at v 8 has its position set to 12
- **THEN** it is at v 12 and its endpoints are unchanged

#### Scenario: Length refused when both ends are attached
- **WHEN** a line's run has min `l1.at` and max `l3.at` and the user sets its length
- **THEN** the edit is refused with a message naming both expressions

### Requirement: Rectangles are four attached lines
Adding a rectangle from two opposite corners SHALL add four lines: two vertical lines at the corners' u values and two horizontal lines at their v values, each running between the other pair, with every endpoint slot holding a bare reference to the position of the perpendicular line it meets. A rectangle with zero width or height SHALL add nothing.

#### Scenario: Rectangle from corners
- **WHEN** a rectangle is added from (2, 4) to (10, 20) into an empty sketch
- **THEN** the sketch has vertical lines `l1` at u 2 and `l2` at u 10 with run min `l3.at` and max `l4.at`, and horizontal lines `l3` at v 4 and `l4` at v 20 with run min `l1.at` and max `l2.at`

#### Scenario: Moving one edge keeps the rectangle closed
- **WHEN** `l2`'s position is set to 14
- **THEN** `l3` and `l4` run from u 2 to u 14 and the rectangle is still one region

### Requirement: Construction lines
A line MAY be marked construction. A construction line SHALL take part in snapping and expressions, SHALL be drawn distinctly, and SHALL NOT bound a region.

#### Scenario: Construction guide
- **WHEN** a vertical construction line crosses a region
- **THEN** the region is unchanged and the line is drawn dashed

### Requirement: Deleting a line
Deleting a line SHALL replace every slot in the sketch whose expression references it with that slot's current resolved value as a plain number. If such a slot has no resolved value, the deletion SHALL be refused with a message naming the slot. Extrudes whose region references name the line SHALL lose those regions, and an extrude left with no regions SHALL be deleted with its dependents after confirmation per `feature-timeline`.

#### Scenario: Delete one side of a rectangle
- **WHEN** `l2` at u 10 is deleted from the rectangle above
- **THEN** `l3` and `l4` have run max 10 as a number and the sketch has no region

## REMOVED Requirements

### Requirement: Rectangles in plane coordinates
**Reason**: Rectangles are no longer stored; a sketch holds lines and a rectangle is four attached lines.
**Migration**: Version 3 files convert each rectangle to four lines on load per `document-file`.

### Requirement: Rectangle edits by size or position
**Reason**: Replaced by the line slot rule; a rectangle's width is edited through its region label, which moves the far line.
**Migration**: None beyond the file conversion; the slot keep rule is unchanged and now applies to a line's run.
