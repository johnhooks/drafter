## MODIFIED Requirements

### Requirement: Name resolution scope
Names SHALL resolve against a scope containing: document parameters by name; lines of the same sketch by handle with the properties `at`, `mid`, `length`, and for a horizontal line `left` and `right`, for a vertical line `bottom` and `top`; and, when the sketch is attached to a face, `face` with the properties `left`, `right`, `bottom`, `top`, `width`, `height`, `umid`, `vmid` describing the face's bounding rectangle in plane coordinates. `face` SHALL be undefined on a principal plane sketch. An unknown name or a property a line's direction does not have SHALL be an error naming it and listing the valid properties. The scope SHALL be an explicit input to evaluation so later changes can add entries without changing the grammar.

#### Scenario: Line position
- **WHEN** `l1` is a vertical line at u 10 and `l1.at + 2` is evaluated
- **THEN** the result is a u position at 12"

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

### Requirement: Positions carry an axis; lengths do not
Every resolved value SHALL be either a length or a position tagged with the model axis it lies on. A horizontal line's `at` SHALL be a position on the plane's v axis and its `left`, `right`, `mid` positions on the u axis; a vertical line's `at` SHALL be on the u axis and its `bottom`, `top`, `mid` on the v axis; `length`, `width`, `height`, parameters, and literals SHALL be lengths. Adding or subtracting a length to a position SHALL give a position on the same axis; subtracting two positions on the same axis SHALL give a length; combining positions on different axes SHALL be an error. A position slot and a run min or max slot SHALL accept a position on their axis or a length; a size slot SHALL accept only a length.

#### Scenario: Position minus position is a length
- **WHEN** a size slot holds `l2.at - l1.at` with both lines vertical
- **THEN** it evaluates to the distance between them

#### Scenario: Wrong axis
- **WHEN** a vertical line's position slot holds `l3.at` and `l3` is horizontal
- **THEN** evaluation fails with an error saying `l3.at` is a v position
