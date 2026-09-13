## MODIFIED Requirements

### Requirement: Linear dimensions
A dimension SHALL have an id, two points in view coordinates (sixteenths), an orientation of horizontal or vertical, and a dimension line position (v for horizontal, u for vertical) in view coordinates. Its value SHALL be the distance between the points along the orientation axis, formatted per `dimension-units`, and SHALL NOT depend on the sheet's scale. Dimensions SHALL NOT be allowed on isometric sheets; changing a sheet with dimensions to isometric SHALL be refused with a message naming the count.

#### Scenario: Horizontal dimension value
- **WHEN** a horizontal dimension has points (0, 30) and (24, 0)
- **THEN** its value displays as `24"`

#### Scenario: Value survives a scale change
- **WHEN** the sheet's scale changes from 1:4 to 1:8
- **THEN** every dimension's value is unchanged

#### Scenario: Dimensioned sheet cannot become isometric
- **WHEN** a sheet holds two dimensions and the user changes its view to isometric
- **THEN** the change is refused with a message saying two dimensions would be lost, and the view is unchanged

### Requirement: Notes
A note SHALL have an id, text, a position in paper coordinates, and an optional leader endpoint in view coordinates. It SHALL draw as the text at 3/32" height with, if a leader is set, a line from the text to the endpoint ending in an arrowhead. Note text MAY contain several lines. Notes SHALL be allowed on every sheet kind, including isometric, where a leader endpoint is a paper position since there is no view geometry to snap to.

#### Scenario: Note with leader
- **WHEN** a note "3/4 ply" is placed with a leader to a face corner
- **THEN** the sheet shows the text and an arrow ending at that corner

#### Scenario: Note on an isometric sheet
- **WHEN** the user places a note on an isometric sheet
- **THEN** the note appears at the click position
