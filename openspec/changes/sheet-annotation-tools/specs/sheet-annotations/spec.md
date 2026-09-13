## Purpose

Lets the user add the measurements and notes a reader of the drawing needs, placed by hand on a sheet, with values taken from the true model size.

## ADDED Requirements

### Requirement: Linear dimensions
A dimension SHALL have an id, two points in view coordinates (sixteenths), an orientation of horizontal or vertical, and a dimension line position (v for horizontal, u for vertical) in view coordinates. Its value SHALL be the distance between the points along the orientation axis, formatted per `dimension-units`, and SHALL NOT depend on the sheet's scale.

#### Scenario: Horizontal dimension value
- **WHEN** a horizontal dimension has points (0, 30) and (24, 0)
- **THEN** its value displays as `24"`

#### Scenario: Value survives a scale change
- **WHEN** the sheet's scale changes from 1:4 to 1:8
- **THEN** every dimension's value is unchanged

### Requirement: Dimension drawing
A dimension SHALL draw extension lines from each point to just past the dimension line, the dimension line between them with a tick at each end, and the value centred above the line (horizontal) or beside it reading upward (vertical). Line weights and text height SHALL be fixed paper sizes (text 3/32") independent of scale. When the points are closer than the text width, the text SHALL be placed outside the extension lines.

#### Scenario: Text outside for small dimension
- **WHEN** a dimension spans 1/2" at 1:8
- **THEN** its text is drawn outside the extension lines, not between them

### Requirement: Snapping for annotation points
While placing dimension points or a leader endpoint, the pointer SHALL snap to projection vertices, then to projection segments per axis, then to the 1/16" grid in view coordinates, using the same priority rule as the sketch editor.

#### Scenario: Snap to hidden corner
- **WHEN** the pointer is near a hidden pocket corner
- **THEN** the point snaps to that corner exactly

### Requirement: Dimensions detect detachment
After the model changes, a dimension whose points no longer lie on any projection vertex or segment SHALL be marked detached, drawn in a warning colour, and listed in the sheet's warnings. Its value SHALL still be computed from its stored points.

#### Scenario: Detached after edit
- **WHEN** a dimension spans a box's width and the box is later made narrower
- **THEN** the dimension is marked detached and its displayed value is unchanged

#### Scenario: Unrelated edit keeps attachment
- **WHEN** a dimension spans a box's width and a different body changes
- **THEN** the dimension is not marked detached

### Requirement: Notes
A note SHALL have an id, text, a position in paper coordinates, and an optional leader endpoint in view coordinates. It SHALL draw as the text at 3/32" height with, if a leader is set, a line from the text to the endpoint ending in an arrowhead. Note text MAY contain several lines.

#### Scenario: Note with leader
- **WHEN** a note "3/4 ply" is placed with a leader to a face corner
- **THEN** the sheet shows the text and an arrow ending at that corner

### Requirement: Annotation persistence
Dimensions and notes SHALL be stored on their sheet in the document JSON and restored with it.

#### Scenario: Round trip
- **WHEN** a sheet with two dimensions and a note is saved and reloaded
- **THEN** all three annotations are present with the same values
