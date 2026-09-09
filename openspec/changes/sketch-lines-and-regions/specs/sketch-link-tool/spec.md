## MODIFIED Requirements

### Requirement: Link tool
The sketch editor SHALL have a Link tool alongside Select, Line, and Rectangle. With it active, clicking a line SHALL choose it as the line to constrain; clicking a second, parallel line or a parallel edge of the reference face SHALL choose the anchor; a text input SHALL then open for the distance, prefilled with the current distance. Enter SHALL write the driven line's position as `<anchor> + d` or `<anchor> - d`, with the sign chosen so the driven line stays on the side of the anchor it is on now. Escape SHALL cancel at any step. Choosing a non-parallel second line SHALL show a message and keep waiting.

#### Scenario: Link to the face
- **WHEN** the user clicks vertical line `l1`, then the face's left edge, and enters `2`
- **THEN** `l1`'s position is `face.left + 2`

#### Scenario: Link to another line
- **WHEN** the user clicks horizontal line `l6`, then horizontal line `l4`, and enters `3/4` with `l6` currently below `l4`
- **THEN** `l6`'s position is `l4.at - 3/4`

#### Scenario: Lines not parallel
- **WHEN** the user clicks a vertical line and then a horizontal line
- **THEN** a message says the lines are not parallel and the tool still waits for an anchor

### Requirement: Linking obeys the slot-edit rule
Writing the driven position SHALL replace it whatever it held. Writing a run slot through an expression typed in the properties SHALL follow the slot rule in `sketch`; if the rule refuses, the refusal is shown and nothing changes.

#### Scenario: Relinking a linked line
- **WHEN** `l1.at` is `face.left + 2` and the user links `l1` to `l3` at `1`
- **THEN** `l1.at` is `l3.at + 1` or `l3.at - 1` by side and the old link is gone

### Requirement: Driving dimensions are drawn for simple links
For every driven slot whose expression is a single reference optionally plus or minus one literal, other than an endpoint attachment, the sketch view SHALL draw a dimension between the anchor coordinate and the driven coordinate with the literal's absolute value as its label (or `0"` for a bare reference). Where the dimension is drawn SHALL follow `sketch-dimension-layout`: the slot's stored placement when it has one, otherwise the automatic placement. Other expressions SHALL be shown as a small tag with the expression text beside the driven line or endpoint.

#### Scenario: Position dimension drawn
- **WHEN** vertical line `l1` has position `face.left + 2` and no placement
- **THEN** a dimension from the face's left edge to `l1` reads `2"` above `l1`'s top end

#### Scenario: Attachment draws nothing
- **WHEN** `l3`'s run min is `l1.at`
- **THEN** no dimension or tag is drawn for that slot

### Requirement: Editing and removing links
Clicking a driving dimension's label SHALL open an inline input for the literal; Enter SHALL rewrite the expression with the new literal keeping its sign. With the Select tool, clicking a dimension SHALL select it and Delete SHALL remove the constraint, leaving the slot as a plain number equal to its current resolved value.

#### Scenario: Edit the distance
- **WHEN** `l1`'s position is `face.left + 2` and the user changes its dimension to `1 1/2`
- **THEN** the slot becomes `face.left + 1 1/2`

#### Scenario: Remove a link
- **WHEN** `l1`'s position is `face.left + 2`, `face.left` is 0, and the user deletes that dimension
- **THEN** `l1`'s position is the number 2"
