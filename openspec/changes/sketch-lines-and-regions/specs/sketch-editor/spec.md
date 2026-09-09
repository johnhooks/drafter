## MODIFIED Requirements

### Requirement: Sketch view shows the plane head-on
Editing a sketch SHALL show a 2D SVG view looking at the plane from its normal side with v up. The view SHALL show a 1" grid with lighter 1/4" subdivisions when zoomed in enough for them to be at least 8 px apart, the plane's origin, coplanar reference faces as light fills, projected body outlines as faint lines, the sketch's lines, and its regions as light fills. The view SHALL support zoom with the wheel and pan by dragging with the middle button or with space held.

#### Scenario: Face sketch shows its face
- **WHEN** a sketch attached to a 24x24 face is opened
- **THEN** the view shows that face as a light filled rectangle in plane coordinates

#### Scenario: Unclosed lines have no fill
- **WHEN** a sketch has three sides of a rectangle
- **THEN** the three lines are drawn and nothing is filled

### Requirement: Drawing a rectangle
With the rectangle tool active, pressing the mouse, dragging, and releasing SHALL add a rectangle per `sketch` whose corners are the snapped press and release positions. A drag that results in zero width or height SHALL create nothing. Width and height SHALL be shown live while dragging.

#### Scenario: Drag creates four lines
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
Each region SHALL show its bounding width below and height to the right as labels, and each line that bounds no region SHALL show its length as a label. Clicking a label SHALL open a text input; Enter or blur SHALL commit a value parsed per `dimension-units`, Escape SHALL cancel, and an invalid value SHALL keep the input open with an error. Committing a region width SHALL set the position of every line on the region's right extreme to the left extreme plus the value, as numbers; a region height likewise moves the top extreme; if any of those positions holds an expression, the edit SHALL be refused with a message naming it. Committing a free line's length SHALL set its run size per the `sketch` slot rule.

#### Scenario: Type a width
- **WHEN** the user clicks a rectangular region's width label showing `24"`, types `23 1/4`, and presses Enter
- **THEN** the region's right line moves so the region is 23 1/4" wide and the label updates

#### Scenario: Width refused when the far line is linked
- **WHEN** the region's right line has position `face.right - 2` and the user types a width
- **THEN** the edit is refused with a message naming that expression

### Requirement: Extrude from the sketch
A toolbar action SHALL create an extrude from the selected regions (all regions if none are selected), with the defaults from `extrude`, and open its properties for editing distance, operation, and target. The action SHALL be unavailable when the sketch has no regions. The 3D view SHALL show the result as soon as the distance is set.

#### Scenario: Extrude selection
- **WHEN** two regions are selected and the user presses Extrude and enters distance `24`
- **THEN** an extrude feature referencing those two regions with distance 24" is appended and the 3D view shows the new body

#### Scenario: Extrude a split
- **WHEN** a rectangle is split by a line and the user extrudes the left region 12 and then the right region 24
- **THEN** two bodies exist, one 12 deep and one 24 deep, sharing the splitting line's plane

## ADDED Requirements

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
The properties panel for a selected line SHALL show its direction, its position, and its run min, max, and size with the derived one marked, a construction checkbox, and a delete action, with the same parsing and error rules as inline editing.

#### Scenario: Move by typing position
- **WHEN** the user sets a horizontal line's position to `12` in the panel
- **THEN** the line moves to v 12" and its endpoints are unchanged

### Requirement: Shape list
The sketch properties SHALL list the sketch's regions as shapes: a region whose decomposition is one rectangle SHALL read "Rectangle" with its size, any other region "Region" with its bounding size, each with the handles of the lines that bound it. Selecting a shape in the list SHALL select the region in the view and the reverse. The lines SHALL be listed separately, collapsed by default, with each line's handle, direction, and error if any.

#### Scenario: A rectangle reads as one shape
- **WHEN** a sketch holds the four lines of a 24" by 16" rectangle
- **THEN** the shape list has one entry, "Rectangle 24" x 16"", naming lines l1 l2 l3 l4

#### Scenario: Shape list follows the view
- **WHEN** the user clicks a region in the view
- **THEN** the same shape is selected in the list

## REMOVED Requirements

### Requirement: Typed rectangle fields
**Reason**: Rectangles are not stored; a line's slots are edited instead and a region's size through its labels.
**Migration**: None.
