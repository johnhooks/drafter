## MODIFIED Requirements

### Requirement: Rectangles in plane coordinates
A rectangle SHALL have an id, a handle, and for each of the u and v axes exactly two driven slots among min, max, and size. A driven slot SHALL hold either a length in sixteenths or an expression per `sketch-expressions`. The third slot SHALL be derived. Resolved width and height SHALL be greater than zero. Rectangles MAY overlap each other.

#### Scenario: Two corners as numbers
- **WHEN** a rectangle has u min 2, u max 10, v min 4, v max 20 as numbers
- **THEN** its width is 8, its height is 16, and its lower-left corner is (2, 4)

#### Scenario: Derived size
- **WHEN** a rectangle's u axis has min 2 and max 10 driven
- **THEN** its u size is derived as 8 and is not stored

#### Scenario: Zero-size rectangle rejected
- **WHEN** a rectangle resolves to u min equal to u max
- **THEN** the rectangle is marked with an error

### Requirement: Rectangle edits by size or position
Setting a slot SHALL make that slot driven with the given value. If three slots on that axis would then be driven, the system SHALL keep the edited slot and the remaining slots in the order min, size, max, dropping the first plain number outside that pair; a slot holding an expression SHALL never be dropped. If keeping the edited slot would require dropping an expression, the edit SHALL be refused with a message naming the expressions.

#### Scenario: Set width keeps the origin corner
- **WHEN** a rectangle with min 4 and max 14 driven has its width set to 12
- **THEN** min 4 and size 12 are driven, max is derived as 16

#### Scenario: Set min moves the rectangle
- **WHEN** a rectangle with min 4 and max 14 driven has its min set to 12
- **THEN** min 12 and size 10 are driven, max is derived as 22

#### Scenario: Set max changes the width
- **WHEN** a rectangle with min 4 and size 10 driven has its max set to 20
- **THEN** min 4 and max 20 are driven, size is derived as 16

#### Scenario: Width refused when both edges are constrained
- **WHEN** a rectangle has min `face.left + 2` and max `face.right - 2` and the user sets its width
- **THEN** the edit is refused with a message naming both expressions
