## RENAMED Requirements
- FROM: `### Requirement: Driving dimensions are drawn for simple links`
- TO: `### Requirement: Constraints are drawn for simple links`

## MODIFIED Requirements

### Requirement: Constraints are drawn for simple links
For every driven slot whose expression is a single reference optionally plus or minus one literal, other than an endpoint attachment, the sketch view SHALL draw the constraint as a measured line between the anchor coordinate and the driven coordinate with the literal's absolute value as its label (or `0"` for a bare reference). The anchor MAY be a face edge, a line's position or run end, or a rectangle's side or middle, which measures against the member line that defines it. Where the constraint is drawn SHALL follow `sketch-dimension-layout`: the slot's stored placement when it has one, otherwise the automatic placement. Other expressions SHALL be shown as a small tag with the expression text beside the driven line or endpoint. Whether a constraint is drawn at all SHALL follow the display and on-demand rules in `sketch-editor`.

#### Scenario: Dimension drawn
- **WHEN** vertical line `l1` has position `face.left + 2` and no placement
- **THEN** a constraint from the face's left edge to `l1` reads `2"` above `l1`'s top end

#### Scenario: Rectangle anchor
- **WHEN** `r1` is a rectangle whose right side is `l2` at 24" and vertical line `l5` has position `r1.right + 1`
- **THEN** a constraint from `l2` to `l5` reads `1"`, the same as if the position were `l2.at + 1`

#### Scenario: Attachment draws nothing
- **WHEN** `l3`'s run min is `l1.at`
- **THEN** no constraint or tag is drawn for that slot

### Requirement: Editing and removing links
Clicking a drawn constraint's label SHALL open an inline input for the literal; Enter SHALL rewrite the expression with the new literal keeping its sign. With the Select tool, clicking a constraint SHALL select it and Delete SHALL remove it, leaving the slot as a plain number equal to its current resolved value.

#### Scenario: Edit the distance
- **WHEN** `l1`'s position is `face.left + 2` and the user changes its constraint to `1 1/2`
- **THEN** the slot becomes `face.left + 1 1/2`

#### Scenario: Remove a link
- **WHEN** `l1`'s position is `face.left + 2`, `face.left` is 0, and the user deletes that constraint
- **THEN** `l1`'s position is the number 2"
