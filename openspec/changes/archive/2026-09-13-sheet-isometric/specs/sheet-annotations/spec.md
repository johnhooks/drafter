## MODIFIED Requirements

### Requirement: Linear dimensions
A dimension SHALL have an id, two points in view coordinates (sixteenths), an orientation of horizontal or vertical, and a dimension line position (v for horizontal, u for vertical) in view coordinates. Its value SHALL be the distance between the points along the orientation axis, formatted per `dimension-units`, and SHALL NOT depend on the sheet's scale. These projected horizontal and vertical dimensions SHALL NOT be allowed on isometric sheets.

#### Scenario: Horizontal dimension value
- **WHEN** a horizontal dimension has points (0, 30) and (24, 0)
- **THEN** its value displays as `24"`

#### Scenario: Value survives a scale change
- **WHEN** the sheet's scale changes from 1:4 to 1:8
- **THEN** every dimension's value is unchanged

#### Scenario: Isometric dimension rejected
- **WHEN** an edit or imported document attempts to add a projected dimension to an isometric sheet
- **THEN** it is rejected without changing the document

### Requirement: Notes
A note SHALL have an id, text, a position in paper coordinates, and an optional leader endpoint in view coordinates for orthographic sheets or paper coordinates for isometric sheets. It SHALL draw as the text at 3/32" height with, if a leader is set, a line from the text to the endpoint ending in an arrowhead. Note text MAY contain several lines. Notes SHALL be allowed on every sheet kind. Isometric leader endpoints SHALL retain their paper position through save/load and model edits, without snapping or attachment to raster geometry.

#### Scenario: Note with leader
- **WHEN** a note "3/4 ply" is placed with a leader to a face corner
- **THEN** the sheet shows the text and an arrow ending at that corner

#### Scenario: Note on an isometric sheet
- **WHEN** the user places a note on an isometric sheet
- **THEN** the note appears at the click position

#### Scenario: Isometric leader stays on paper
- **WHEN** an isometric note has a leader and the model changes or the document is saved and reloaded
- **THEN** the leader retains its paper coordinates rather than tracking model geometry
