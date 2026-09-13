## MODIFIED Requirements

### Requirement: Sheet page and view settings
A sheet SHALL have: page orientation, portrait or landscape, on US letter (8 1/2" by 11") with 1/2" margins; a view kind of front, top, left, right, or isometric; a target of the whole model or one body id; and a scale from the list 1:1, 1:2, 1:4, 1:8, 1:12, 1:16, 1:24, which SHALL NOT apply to an isometric sheet. New sheets SHALL default to landscape, front, whole model, and the largest listed scale at which the view fits the drawing area.

#### Scenario: Default scale fits
- **WHEN** a new sheet is created for a model 60" wide and 36" tall
- **THEN** the sheet is landscape and its scale is 1:8

#### Scenario: Scale too large warns
- **WHEN** the user picks 1:1 for a model 60" wide
- **THEN** the sheet shows a warning that the view exceeds the drawing area and still draws it, clipped

## ADDED Requirements

### Requirement: Isometric sheets use the 3D rendering
A sheet with the isometric view SHALL show the same rendering as the 3D view, framed to the target, as a raster image at print resolution (at least 300 dots per inch on paper) filling the drawing area. Scale SHALL be shown as NTS (not to scale) in the title block. The image SHALL be regenerated when the target or the model changes.

#### Scenario: Iso sheet
- **WHEN** a sheet's view is set to isometric
- **THEN** the scale selector is disabled and the title block reads NTS

#### Scenario: Iso sheet follows the model
- **WHEN** an extrude distance changes
- **THEN** every isometric sheet showing that body re-renders
