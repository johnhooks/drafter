## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Thin annotation strokes
Dimension lines, extension lines, dimension ticks, and note leaders SHALL use 0.25 mm strokes on paper in preview, standalone SVG export, and app and native browser printing at 100%, independent of model scale. Normal annotations SHALL remain black; existing selection and detached-warning colours SHALL remain. Text height, tick length, arrowhead shape, and note leader endpoints SHALL remain unchanged. The dimension extension gap SHALL NOT be applied to note leaders. This rule SHALL also apply to note leaders on isometric sheets without changing the raster geometry.

#### Scenario: Thin annotations in output
- **WHEN** a sheet with dimensions and a note leader is previewed, exported, or printed
- **THEN** its annotation strokes are 0.25 mm on paper and use their existing normal or warning colours

#### Scenario: Isometric note leader
- **WHEN** an isometric sheet contains a note leader
- **THEN** its leader uses a 0.25 mm stroke and still reaches its stored paper endpoint without a new gap
