# sheet-annotations Specification

## Purpose

Lets the user add the measurements and notes a reader of the drawing needs, placed by hand on a sheet, with values taken from the true model size.

## Requirements

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

### Requirement: Dimension drawing
A dimension SHALL draw extension lines beginning 1/16" from each measured point toward the dimension line and ending 1/16" past that line, the dimension line between them with a tick at each end, and the value centred above the line (horizontal) or beside it reading upward (vertical). If a measured point is no farther than 1/16" from the dimension line on paper, its extension line SHALL be omitted rather than reversed or drawn across the point. The dimension line, ticks, and label SHALL remain. Line weights, gaps, overruns, and text height SHALL be fixed paper sizes (text 3/32") independent of scale. When the points are closer than the text width, the text SHALL be placed outside the extension lines. These display offsets SHALL NOT change stored measured points or the displayed measurement.

#### Scenario: Text outside for small dimension
- **WHEN** a dimension spans 1/2" at 1:8
- **THEN** its text is drawn outside the extension lines, not between them

#### Scenario: Gap separates extension from geometry
- **WHEN** a horizontal or vertical dimension is placed more than 1/16" from each measured point on paper
- **THEN** each extension begins 1/16" from its measured point toward the dimension line and ends 1/16" beyond that line
- **AND** the same rule applies on either side of the measured points

#### Scenario: Dimension close to a measured point
- **WHEN** the dimension line is at, within, or exactly 1/16" from a measured point on paper
- **THEN** that point's extension line is omitted while the dimension line, ticks, and label remain

#### Scenario: Gap survives scale and movement
- **WHEN** the scale changes from 1:4 to 1:8 or a dimension is dragged across its measured points
- **THEN** each extension is recalculated using the same paper gap and overrun, with no changes to the measurement or stored measured points

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

### Requirement: Annotation persistence
Dimensions and notes SHALL be stored on their sheet in the document JSON and restored with it.

#### Scenario: Round trip
- **WHEN** a sheet with two dimensions and a note is saved and reloaded
- **THEN** all three annotations are present with the same values

### Requirement: Thin annotation strokes
Dimension lines, extension lines, dimension ticks, and note leaders SHALL use 0.25 mm strokes on paper in preview, standalone SVG export, and app and native browser printing at 100%, independent of model scale. Normal annotations SHALL remain black; existing selection and detached-warning colours SHALL remain. Text height, tick length, arrowhead shape, and note leader endpoints SHALL remain unchanged. The dimension extension gap SHALL NOT be applied to note leaders. This rule SHALL also apply to note leaders on isometric sheets without changing the raster geometry.

#### Scenario: Thin annotations in output
- **WHEN** a sheet with dimensions and a note leader is previewed, exported, or printed
- **THEN** its annotation strokes are 0.25 mm on paper and use their existing normal or warning colours

#### Scenario: Isometric note leader
- **WHEN** an isometric sheet contains a note leader
- **THEN** its leader uses a 0.25 mm stroke and still reaches its stored paper endpoint without a new gap
