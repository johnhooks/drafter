# sketch-editor Specification

## Purpose
Lets the user draw and adjust rectangles on a sketch plane with the mouse and keyboard, snapped to a sixteenth of an inch, with dimensions that can be edited in place.

## Requirements

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

### Requirement: Drawing a rectangle
With the rectangle tool active, pressing the mouse, dragging, and releasing SHALL add a rectangle per `sketch` whose corners are the snapped press and release positions. A drag that results in zero width or height SHALL create nothing. Width and height SHALL be shown live while dragging.

#### Scenario: Drag creates rectangle
- **WHEN** the user presses at snapped (2, 2) and releases at snapped (26, 32)
- **THEN** four attached lines enclosing (2, 2) to (26, 32) are added and one region appears

### Requirement: Snapping
Pointer positions SHALL snap to the nearest 1/16" in u and v. When within 6 px of a reference face edge, a reference outline edge, or a line in the sketch, the position SHALL snap to that edge's coordinate instead, independently in u and v; corners and line endpoints SHALL snap in both. The active snap SHALL be indicated visually.

#### Scenario: Snap to a line
- **WHEN** the user moves the pointer to within 6 px of a vertical line at u = 24
- **THEN** the snapped u is exactly 24

#### Scenario: Grid snap
- **WHEN** the pointer is at a position that converts to u = 10.03"
- **THEN** the snapped u is 10"

### Requirement: Selection and deletion
With the select tool active, clicking a line SHALL select it; clicking inside a region and not on a line SHALL select the region; shift-click SHALL add to or remove from the selection; clicking empty space SHALL clear it. Lines and regions MAY be selected together. Delete or Backspace SHALL remove selected lines per `sketch` and, when only regions are selected, the lines that bound only those regions. Selected lines and regions SHALL be highlighted, and the line or region under the pointer SHALL be highlighted lightly.

#### Scenario: Shift-click adds
- **WHEN** region A is selected and the user shift-clicks region B
- **THEN** both A and B are selected

#### Scenario: Line wins over region
- **WHEN** the user clicks within 6 px of a line that bounds a region
- **THEN** the line is selected and the region is not

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

### Requirement: Extrude from the sketch
A toolbar action SHALL create an extrude from the selected regions (all regions if none are selected), with the defaults from `extrude`, and open its properties for editing distance, operation, and target. The action SHALL be unavailable when the sketch has no regions. The 3D view SHALL show the result as soon as the distance is set.

#### Scenario: Extrude selection
- **WHEN** two regions are selected and the user presses Extrude and enters distance `24`
- **THEN** an extrude feature referencing those two regions with distance 24" is appended and the 3D view shows the new body

#### Scenario: Extrude a split
- **WHEN** a rectangle is split by a line and the user extrudes the left region 12 and then the right region 24
- **THEN** two bodies exist, one 12 deep and one 24 deep, sharing the splitting line's plane

### Requirement: Finishing a sketch
A Finish action SHALL leave sketch editing and return to the 3D view. The sketch SHALL remain in the timeline and MAY be reopened for editing from the timeline.

#### Scenario: Reopen sketch
- **WHEN** the user finishes Sketch 1 and later selects Edit on Sketch 1 in the timeline
- **THEN** the sketch view opens with Sketch 1's rectangles and reference geometry from its point in the timeline

### Requirement: Drawing lines
With the Line tool active, a click SHALL set the start of a line and the next click SHALL set its end and start a new line from there. The end SHALL be projected onto the axis along which the pointer has moved farther from the start, so every line is horizontal or vertical. A click at the start's own position SHALL create nothing. Escape or Enter SHALL end the chain. An endpoint that lies on a perpendicular line, within that line's run, SHALL be attached to it: its slot holds a bare reference to that line's position. A plain-number endpoint of an existing perpendicular line that lies on the new line SHALL be attached to the new line the same way, so a chain of lines that closes an outline is attached at every corner. The line SHALL be previewed while the pointer moves.

#### Scenario: Split a rectangle
- **WHEN** a rectangle spans u 0 to 24, v 0 to 16 and the user clicks at (10, 0) then at (10, 16)
- **THEN** a vertical line at u 10 is added with run min attached to the bottom line and run max attached to the top line, and the sketch has two regions

#### Scenario: A chain closes into an attached rectangle
- **WHEN** the user clicks (0, 0), (24, 0), (24, 16), (0, 16), and (0, 0) with the Line tool
- **THEN** four lines exist, every run end of every line is a reference to the perpendicular line it meets, and the sketch has one region

#### Scenario: Diagonal drag projects
- **WHEN** the user clicks at (0, 0) and then at (20, 3)
- **THEN** a horizontal line at v 0 from u 0 to u 20 is added and the next line starts at (20, 0)

### Requirement: Construction toggle
Pressing X with the Select tool, or a checkbox in the line properties, SHALL toggle construction on the selected lines. Construction lines SHALL be drawn dashed and lighter.

#### Scenario: Toggle with the key
- **WHEN** a line that splits a region is selected and the user presses X
- **THEN** the line is dashed and the two regions merge into one

### Requirement: Typed line fields
The properties panel for a selected line SHALL show its direction, its position, and its run min, max, and size with the derived one marked, a construction checkbox, and a delete action, with the same parsing and error rules as inline editing. When the line is a member of a rectangle, the rectangle's form per `sketch-rectangles` SHALL be shown above it with the member's side marked. When exactly four lines are selected, a Make rectangle action SHALL be offered.

#### Scenario: Move by typing position
- **WHEN** the user sets a horizontal line's position to `12` in the panel
- **THEN** the line moves to v 12" and its endpoints are unchanged

#### Scenario: Member line shows the rectangle
- **WHEN** the user selects the right line of `r1`
- **THEN** the panel shows `r1`'s form with Right marked, then the line's own fields

### Requirement: Shape list
The sketch properties SHALL list the sketch's regions as shapes: a region that is exactly the area of a rectangle record SHALL read as that rectangle's handle with its size, any other region "Region" with its bounding size, each with the handles of the lines that bound it. Selecting a shape in the list SHALL select the region in the view and the reverse. The lines SHALL be listed separately, collapsed by default, with each line's handle, direction, and error if any.

#### Scenario: A rectangle reads as one shape
- **WHEN** a sketch holds `r1`, 24" by 16", drawn with the Rectangle tool
- **THEN** the shape list has one entry, "r1 24" x 16"", naming lines l1 l2 l3 l4

#### Scenario: A split rectangle is two regions
- **WHEN** a line splits `r1` across
- **THEN** the shape list has two "Region" entries and `r1` still exists with its form

#### Scenario: Shape list follows the view
- **WHEN** the user clicks a region in the view
- **THEN** the same shape is selected in the list

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
