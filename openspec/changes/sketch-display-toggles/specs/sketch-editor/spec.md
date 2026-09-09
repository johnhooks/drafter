## MODIFIED Requirements

### Requirement: Sketch view shows the plane head-on
Editing a sketch SHALL show a 2D SVG view looking at the plane from its normal side with v up. The view SHALL show a 1" grid with lighter 1/4" subdivisions when zoomed in enough for them to be at least 8 px apart, the plane's origin, coplanar reference faces as light fills, projected body outlines as faint lines, the sketch's lines, its regions as light fills, and its driving dimensions. It SHALL NOT show line handles or size labels unless the rules in "Labels appear on demand" or a display toggle call for them. The view SHALL support zoom with the wheel and pan by dragging with the middle button or with space held.

#### Scenario: Face sketch shows its face
- **WHEN** a sketch attached to a 24x24 face is opened
- **THEN** the view shows that face as a light filled rectangle in plane coordinates

#### Scenario: Unclosed lines have no fill
- **WHEN** a sketch has three sides of a rectangle
- **THEN** the three lines are drawn and nothing is filled

#### Scenario: A finished rectangle is quiet
- **WHEN** a rectangle has been drawn and nothing is hovered or selected
- **THEN** the view shows four lines and one fill, and no handle or size label

### Requirement: Inline dimension editing
A region SHALL show its bounding width below and height to the right as labels, and a line that bounds no region SHALL show its length as a label, while the region or line is hovered or selected or while the sizes toggle is on. Clicking a visible label SHALL open a text input; Enter or blur SHALL commit a value parsed per `dimension-units`, Escape SHALL cancel, and an invalid value SHALL keep the input open with an error. Committing a region width SHALL set the position of every line on the region's right extreme to the left extreme plus the value, as numbers; a region height likewise moves the top extreme; if any of those positions holds an expression, the edit SHALL be refused with a message naming it. Committing a free line's length SHALL set its run size per the `sketch` slot rule. A label being edited SHALL stay visible until the edit ends.

#### Scenario: Type a width
- **WHEN** the user selects a rectangular region, clicks its width label showing `24"`, types `23 1/4`, and presses Enter
- **THEN** the region's right line moves so the region is 23 1/4" wide and the label updates

#### Scenario: Width refused when the far line is linked
- **WHEN** the region's right line has position `face.right - 2` and the user types a width
- **THEN** the edit is refused with a message naming that expression

#### Scenario: Hover shows the size
- **WHEN** the pointer moves over a region that is not selected
- **THEN** its width and height labels appear, and they disappear when the pointer leaves

## ADDED Requirements

### Requirement: Labels appear on demand
Line handles SHALL be shown on the hovered line, on every selected line, and on every resolved line while a text field that accepts an expression has focus. Size labels SHALL be shown for the hovered region or free line and for every selected region or free line. A selected region SHALL show its size labels and not the handles of its bounding lines. Labels shown this way SHALL be drawn, dragged, and edited exactly as when shown by a toggle.

#### Scenario: Handles while typing an expression
- **WHEN** the user focuses a line's Position field
- **THEN** every line in the sketch shows its handle, and the handles disappear when the field loses focus

#### Scenario: Selected line
- **WHEN** the user selects a line with the Select tool
- **THEN** that line shows its handle, and its length if it bounds no region, and other lines show nothing

### Requirement: Display toggles
The sketch toolbar SHALL hold icon toggles for grid, driving dimensions, handles, and sizes, each with a tooltip naming it. Grid and driving dimensions SHALL default on; handles and sizes SHALL default off. While handles or sizes is on, every line handle or every size label SHALL be shown regardless of hover and selection. The toggles SHALL be remembered in the browser across reloads and documents, and SHALL NOT be part of the document file.

#### Scenario: Show all sizes
- **WHEN** the user turns the sizes toggle on
- **THEN** every region shows its width and height and every free line its length, and after a reload the toggle is still on

#### Scenario: Hide the grid
- **WHEN** the user turns the grid toggle off
- **THEN** the grid lines are not drawn and snapping to sixteenths still applies
