## MODIFIED Requirements

### Requirement: Name resolution scope
Names SHALL resolve against a scope containing: document parameters by name; lines of the same sketch by handle with the properties `at`, `mid`, `length`, and for a horizontal line `left` and `right`, for a vertical line `bottom` and `top`; rectangles of the same sketch by handle with `left`, `right`, `bottom`, `top`, `umid`, `vmid`, `width`, `height`, resolved from the member lines' positions; and, when the sketch is attached to a face, `face` with the same properties as a rectangle describing the face's bounding rectangle in plane coordinates. `face` SHALL be undefined on a principal plane sketch. An unknown name or a property the object does not have SHALL be an error naming it and listing the valid properties. The scope SHALL be an explicit input to evaluation so later changes can add entries without changing the grammar.

#### Scenario: Line position
- **WHEN** `l1` is a vertical line at u 10 and `l1.at + 2` is evaluated
- **THEN** the result is a u position at 12"

#### Scenario: Rectangle properties
- **WHEN** `r1`'s left line is at u 2 and its right line at u 26 and `r1.width / 2` is evaluated
- **THEN** the result is 12", and `r1.right` is a u position at 26"

#### Scenario: Wrong direction property
- **WHEN** `l1` is vertical and `l1.left` is evaluated
- **THEN** evaluation fails with an error saying a vertical line has `bottom`, `top`, `mid`, `length`, `at`

#### Scenario: Face reference
- **WHEN** a sketch on the top face of a 24" cube at the origin evaluates `face.right - 2`
- **THEN** the result is 22"

#### Scenario: Unknown name
- **WHEN** `l9.at + 1` is evaluated in a sketch with no line `l9`
- **THEN** evaluation fails with an error naming `l9`

#### Scenario: No face on a principal plane
- **WHEN** a sketch on XZ evaluates `face.left`
- **THEN** evaluation fails with an error saying the sketch has no face
