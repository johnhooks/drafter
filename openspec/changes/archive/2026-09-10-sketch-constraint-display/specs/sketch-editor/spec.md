## MODIFIED Requirements

### Requirement: Sketch view shows the plane head-on
Editing a sketch SHALL show a 2D SVG view looking at the plane from its normal side with v up. The view SHALL show a 1" grid with lighter 1/4" subdivisions when zoomed in enough for them to be at least 8 px apart, the plane's origin, coplanar reference faces as light fills, projected body outlines as faint lines, the sketch's lines, its regions as light fills, and, while the constraints toggle is on, its constraints. It SHALL NOT show line handles, size labels, or constraints unless the rules in "Labels appear on demand" or a display toggle call for them. The view SHALL support zoom with the wheel and pan by dragging with the middle button or with space held.

#### Scenario: Face sketch shows its face
- **WHEN** a sketch attached to a 24x24 face is opened
- **THEN** the view shows that face as a light filled rectangle in plane coordinates

#### Scenario: Unclosed lines have no fill
- **WHEN** a sketch has three sides of a rectangle
- **THEN** the three lines are drawn and nothing is filled

#### Scenario: A finished rectangle is quiet
- **WHEN** a rectangle has been drawn and nothing is hovered or selected
- **THEN** the view shows four lines and one fill, and no handle or size label

### Requirement: Labels appear on demand
Line handles SHALL be shown on the hovered line, on every selected line, and on every resolved line while a text field that accepts an expression has focus. Size labels SHALL be shown for the hovered region or free line and for every selected region or free line. A selected region SHALL show its size labels and not the handles of its bounding lines. The constraints of the hovered line and of every selected line SHALL be shown, and a constraint selected from the sketch's constraint list SHALL be shown. Labels and constraints shown this way SHALL be drawn, dragged, and edited exactly as when shown by a toggle.

#### Scenario: Handles while typing an expression
- **WHEN** the user focuses a line's Position field
- **THEN** every line in the sketch shows its handle, and the handles disappear when the field loses focus

#### Scenario: Selected line
- **WHEN** the user selects a line with the Select tool
- **THEN** that line shows its handle, and its length if it bounds no region, and other lines show nothing

#### Scenario: Hovered line shows its constraints
- **WHEN** the constraints toggle is off, `l1`'s position is `face.left + 2`, and the pointer moves over `l1`
- **THEN** the `2"` constraint from the face's left edge to `l1` is drawn, and it disappears when the pointer leaves

#### Scenario: Selected constraint stays shown
- **WHEN** the constraints toggle is off and the user clicks `l1.at = face.left + 2` in the sketch's constraint list
- **THEN** that constraint is drawn and highlighted until the selection changes

### Requirement: Display toggles
The sketch toolbar SHALL hold icon toggles for grid, constraints, handles, and sizes, each with a tooltip naming it. Grid and constraints SHALL default on; handles and sizes SHALL default off. While handles, sizes, or constraints is on, every line handle, every size label, or every constraint SHALL be shown regardless of hover and selection; while constraints is on, the constraints of the hovered line and of every selected line SHALL be highlighted. The toggles SHALL be remembered in the browser across reloads and documents, and SHALL NOT be part of the document file. A remembered dimensions toggle from an earlier version SHALL be read as the constraints toggle.

#### Scenario: Show all sizes
- **WHEN** the user turns the sizes toggle on
- **THEN** every region shows its width and height and every free line its length, and after a reload the toggle is still on

#### Scenario: Hide the grid
- **WHEN** the user turns the grid toggle off
- **THEN** the grid lines are not drawn and snapping to sixteenths still applies

#### Scenario: Constraints off
- **WHEN** `l1`'s position is `face.left + 2`, nothing is hovered or selected, and the user turns the constraints toggle off
- **THEN** the `2"` constraint is not drawn and `l1` shows a tick at its midpoint

#### Scenario: Hover highlights with the toggle on
- **WHEN** the constraints toggle is on, `l1` and `l2` each have a constraint, and the pointer moves over `l1`
- **THEN** both constraints are drawn and `l1`'s is highlighted

## ADDED Requirements

### Requirement: A driven slot shows a resting tick
A line whose position is an expression SHALL carry a short tick across its midpoint, and a line whose run min or max is an expression other than an endpoint attachment SHALL carry the same tick across that end, drawn in the constraint colour at a fixed screen size, whenever the slot's constraint is not drawn. A slot whose constraint is drawn, an endpoint attachment, and a line that failed to resolve SHALL carry no tick.

#### Scenario: Position tick
- **WHEN** the constraints toggle is off and horizontal line `l4` has position `l2.at - 3/4`
- **THEN** `l4` shows a tick at its midpoint and no tick at either end

#### Scenario: Run end tick
- **WHEN** the constraints toggle is off and vertical line `l1` has run max `face.top - 1`
- **THEN** `l1` shows a tick at its top end

#### Scenario: Attached corner has no tick
- **WHEN** `l3`'s run min is `l1.at` and `l1` is perpendicular to `l3`
- **THEN** `l3` shows no tick at that end

#### Scenario: Tick gives way to the constraint
- **WHEN** the constraints toggle is on, or `l4` is hovered or selected
- **THEN** `l4`'s constraint is drawn and its tick is not

### Requirement: The anchor of an on-demand constraint is highlighted
Whenever a constraint is drawn because its line is hovered or selected or because it is the selected constraint, the edge it measures from SHALL be highlighted: the anchor line, the reference face's edge, or a rectangle side's member line. A constraint drawn only because the toggle is on SHALL NOT highlight its anchor. A constraint whose anchor is a middle SHALL highlight the two edges the middle lies between.

#### Scenario: Hover highlights the face edge
- **WHEN** `l1`'s position is `face.left + 2` and the pointer moves over `l1`
- **THEN** the face's left edge is highlighted, and it is not once the pointer leaves

#### Scenario: Selected line highlights the anchor line
- **WHEN** `l2`'s run max is `l3.at - 1` and the user selects `l2`
- **THEN** `l3` is highlighted as the anchor

#### Scenario: Toggle alone highlights nothing
- **WHEN** the constraints toggle is on and nothing is hovered or selected
- **THEN** every constraint is drawn and no anchor is highlighted
