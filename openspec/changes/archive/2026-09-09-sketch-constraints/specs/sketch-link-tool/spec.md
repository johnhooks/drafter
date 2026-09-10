## Purpose

Lets the user create edge-to-edge constraints by clicking in the sketch rather than typing expressions, and see and edit them as driving dimensions.

## ADDED Requirements

### Requirement: Link tool
The sketch editor SHALL have a Link tool alongside Select and Rectangle. With it active, clicking an edge of a rectangle SHALL choose it as the edge to constrain; clicking a second, parallel edge of another rectangle or of the reference face SHALL choose the anchor; a text input SHALL then open for the distance, prefilled with the current distance. Enter SHALL write the driven edge's slot as `<anchor> + d` or `<anchor> - d`, with the sign chosen so the driven edge stays on the side of the anchor it is on now. Escape SHALL cancel at any step. Choosing a non-parallel second edge SHALL show a message and keep waiting.

#### Scenario: Link to the face
- **WHEN** the user clicks `r1`'s left edge, then the face's left edge, and enters `2`
- **THEN** `r1`'s u min is `face.left + 2`

#### Scenario: Link to another rectangle
- **WHEN** the user clicks `r2`'s top edge, then `r1`'s bottom edge, and enters `3/4` with `r2` currently below `r1`
- **THEN** `r2`'s v max is `r1.bottom - 3/4`

#### Scenario: Edges not parallel
- **WHEN** the user clicks `r1`'s left edge and then `r1`'s top edge
- **THEN** a message says the edges are not parallel and the tool still waits for an anchor

### Requirement: Linking obeys the slot-edit rule
Writing the driven slot SHALL follow the slot-edit rule in `sketch`. If the rule refuses, the tool SHALL show the refusal and make no change.

#### Scenario: Both edges already linked
- **WHEN** `r1`'s left and right are expressions and the user links `r1`'s width to another edge
- **THEN** the tool shows the refusal message and `r1` is unchanged

### Requirement: Driving dimensions are drawn for simple links
For every driven slot whose expression is a single reference optionally plus or minus one literal, the sketch view SHALL draw a dimension between the anchor edge and the driven edge with the literal's absolute value as its label (or `0"` for a bare reference). Other expressions SHALL be shown as a small tag with the expression text beside the driven edge.

#### Scenario: Dimension drawn
- **WHEN** `r1`'s u min is `face.left + 2`
- **THEN** a dimension from the face's left edge to `r1`'s left edge reads `2"`

### Requirement: Editing and removing links
Clicking a driving dimension's label SHALL open an inline input for the literal; Enter SHALL rewrite the expression with the new literal keeping its sign. With the Select tool, clicking a dimension SHALL select it and Delete SHALL remove the constraint, leaving the slot as a plain number equal to its current resolved value.

#### Scenario: Edit the distance
- **WHEN** `r1`'s u min is `face.left + 2` and the user changes its dimension to `1 1/2`
- **THEN** the slot becomes `face.left + 1 1/2`

#### Scenario: Remove a link
- **WHEN** `r1`'s u min is `face.left + 2`, `face.left` is 0, and the user deletes that dimension
- **THEN** `r1`'s u min is the number 2"
