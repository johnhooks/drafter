## ADDED Requirements

### Requirement: Printed line hierarchy
Orthographic sheets SHALL draw visible object edges as solid black lines 0.50 mm wide on paper and hidden edges as dashed black lines 0.25 mm wide on paper. Existing dash lengths SHALL remain unchanged. These widths SHALL be identical in the sheet preview, standalone SVG export, and app and native browser printing at 100%, independent of model scale. Viewport zoom SHALL magnify the entire sheet without changing its output widths. Existing documents SHALL use these widths without changes to stored data or a new setting. Isometric raster geometry, page borders, and title blocks SHALL retain their existing presentation.

#### Scenario: Object edges stand out
- **WHEN** an orthographic sheet contains visible edges, hidden edges, and a dimension
- **THEN** the visible edges are twice the width of the hidden edges and dimension strokes, with hidden edges retaining their dash pattern

#### Scenario: Scale and output retain widths
- **WHEN** an orthographic sheet changes from 1:4 to 1:8 and is previewed, exported, or printed at 100%
- **THEN** visible edges remain 0.50 mm and hidden edges remain 0.25 mm on paper in every output
- **AND** viewport zoom does not change exported or printed widths

#### Scenario: Existing documents need no migration
- **WHEN** a previously saved sheet is opened
- **THEN** its orthographic edges use the new widths without changing geometry, scale, or annotation coordinates
