## MODIFIED Requirements

### Requirement: Sheet page and view settings
A sheet SHALL have: page orientation, portrait or landscape, on US letter (8 1/2" by 11") with 1/2" margins; a view kind of front, top, left, right, or isometric; a target of the whole model or one body id; and a scale from the list 1:1, 1:2, 1:4, 1:8, 1:12, 1:16, 1:24, applying to every view kind. New sheets SHALL default to landscape, front, whole model, and the largest listed scale at which the chosen projection fits the drawing area. Isometric creation SHALL fit the captured camera projection, not a front view or model diagonal. Empty targets SHALL default to 1:1; when no listed scale fits, creation SHALL use 1:24 and show an overflow warning.

Subsequent model, target, and page orientation changes SHALL preserve the selected scale. Saved isometric sheets SHALL retain and apply their stored scale on load, without automatic refitting. Scale edits SHALL be undoable and preserved by save/load.

The view kind and direction SHALL be chosen before confirming creation and SHALL NOT be editable afterward, regardless of whether annotations exist. Isometric creation SHALL capture the current 3D camera orientation, not its pan or zoom. Existing orthographic sheets SHALL retain their saved direction and SHALL also be view-locked. Creating a different view SHALL require another sheet.

#### Scenario: Choose and lock a view
- **WHEN** the user chooses Top and confirms sheet creation
- **THEN** the sheet shows Top and offers no way to change its view direction

#### Scenario: Existing sheet retains its view
- **WHEN** an existing orthographic sheet is loaded
- **THEN** its saved view and annotations are preserved and its direction cannot be edited

#### Scenario: Default scale fits
- **WHEN** a new sheet is created for a model 60" wide and 36" tall
- **THEN** the sheet is landscape and its scale is 1:8

#### Scenario: Scale too large warns
- **WHEN** the user picks 1:1 for a model 60" wide
- **THEN** the sheet shows a warning that the view exceeds the drawing area and still draws it, clipped

### Requirement: The view is centred in the drawing area
The drawing area SHALL be the page inside the margins less the title block. An orthographic view SHALL be drawn centred in that area at the chosen scale, visible segments as solid lines and hidden segments as dashed lines, with line weights and dash lengths fixed in paper inches. Paper coordinates SHALL be inches on the page; orthographic view coordinates SHALL map to paper by the scale and the centring offset. An isometric view SHALL also be centred by its projected target bounds and drawn at the selected ratio using the captured orientation without perspective. At 1:n, one model inch projected into the camera plane SHALL occupy 1/n inch on paper. Foreshortening of oblique edges SHALL NOT be compensated. Oversized isometric views SHALL warn and clip to the drawing area rather than shrink to fit.

#### Scenario: Centred view
- **WHEN** a 24" by 30" front view is placed on a landscape sheet at 1:4
- **THEN** it is drawn 6" by 7 1/2" centred in the drawing area

#### Scenario: Hidden edges dashed
- **WHEN** a sheet shows the front view of a body with a pocket in its top
- **THEN** the pocket's edges are drawn dashed inside a solid outline

#### Scenario: Isometric fits the page
- **WHEN** an isometric sheet is created
- **THEN** its target is centred at the largest listed fitting scale without changing the captured camera orientation, or at 1:24 with a warning if none fits

#### Scenario: Isometric projected scale
- **WHEN** an isometric sheet at 1:4 shows an edge 24" long parallel to the camera plane
- **THEN** that edge occupies 6" on paper
- **AND** selecting 1:8 halves its paper length without changing the camera orientation

#### Scenario: Isometric overflow preserves ratio
- **WHEN** an isometric target grows beyond the drawing area at the selected scale
- **THEN** the sheet keeps that ratio, recentres the projection, warns, and clips the oversized view

#### Scenario: Sheet navigation does not change output size
- **WHEN** the user pans or zooms the sheet viewport
- **THEN** the scale ratio and model size in print and export remain unchanged

## ADDED Requirements

### Requirement: Isometric sheets use the 3D rendering
A sheet with the isometric view SHALL show the same rendering as the 3D view using the camera orientation captured at creation, centred at the selected scale, as a raster image at print resolution (at least 300 dots per inch on paper) covering the drawing area. The captured orientation SHALL be stored with the sheet and preserved through save/load and undo/redo. Invalid or missing isometric camera orientation SHALL be rejected when loading a file. The title block and sheet list SHALL show the selected ratio, not NTS. The image SHALL be regenerated when the target, model, scale, or page orientation changes, retaining the captured camera orientation and selected ratio. Later movement of the model camera SHALL NOT change an existing sheet.

#### Scenario: Iso sheet
- **WHEN** an isometric sheet is created
- **THEN** the scale selector is enabled and the title block shows the selected ratio

#### Scenario: Iso sheet follows the model
- **WHEN** an extrude distance changes
- **THEN** every isometric sheet showing that body re-renders at its own captured orientation and selected scale

#### Scenario: Captured camera is independent
- **WHEN** an isometric sheet is created and the user later rotates the model camera
- **THEN** the sheet retains its captured orientation, including after saving and reloading the document

#### Scenario: Distinct captured views
- **WHEN** two isometric sheets of the same target are created from different camera orientations
- **THEN** each sheet renders its own captured view
