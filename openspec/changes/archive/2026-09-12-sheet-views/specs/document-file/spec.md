## MODIFIED Requirements

### Requirement: A file holds a model and a view
A saved file SHALL contain a version, a `model` with the title, parameters, and features, an optional `sheets` list of drawing sheets in order, an optional positive integer `nextSheetNumber` counter, and a `view` with display state. A file without `sheets` SHALL load with no sheets. An absent counter SHALL default to one past the highest numbered sheet name, or 1 when none exist. The `view` SHALL hold the camera as orbit azimuth and elevation in degrees, an orthographic zoom, and a centre point in sixteenths, and MAY hold the id of the sketch open for editing. The view SHALL NOT affect evaluation.

#### Scenario: Sheets saved in order
- **WHEN** a document with two sheets is downloaded
- **THEN** the file's `sheets` holds both in order and loads them back in that order

#### Scenario: Last-change date survives reload
- **WHEN** a sheet document is edited and saved with a `modifiedDate` in local `YYYY-MM-DD` form, then reopened on a later day
- **THEN** the title block retains the saved date until the document is edited again; files without a date use the opening date

#### Scenario: Both parts saved
- **WHEN** the user rotates the view, then adds a rectangle, then downloads the file
- **THEN** the file's `view` holds the rotated camera and its `model` holds the rectangle

### Requirement: Earlier versions load
Version 1 to 5 files SHALL load, be converted to version 6, and be saved as version 6. A version 5 model SHALL load unchanged with no sheets. Converting a version 3 model SHALL turn each rectangle into four lines attached at their endpoints and a rectangle record with the rectangle's original handle, with the rectangle's driven slots becoming the lines' positions (a driven size becoming the far line's position as an expression over the near line), assign line handles in order, leave expressions that name rectangle properties unchanged, turn each extrude's rectangle ids into references to the region at each rectangle's lower-left corner, turn each face reference into the matching cap, base, or side reference, and carry dimension placements to the corresponding line slots and region labels. An extrude of a rectangle that other rectangles' lines subdivide SHALL reference only the region at that rectangle's lower-left corner; the other parts are not extruded until the user adds them. A version 4 model SHALL load unchanged with no rectangle records; its line expressions stay as written.

#### Scenario: Version 3 rectangle
- **WHEN** a version 3 file with a rectangle `r1` with u min 0, u max 384, v min 0, v max 384 and an extrude of `r1` is opened
- **THEN** it loads as version 6 with four attached lines enclosing that square, a rectangle `r1` over them, and an extrude referencing the region at the corner of its left and bottom lines, and evaluates to the same body

#### Scenario: Version 3 expressions
- **WHEN** a version 3 rectangle `r2` has u min `r1.right + 1`
- **THEN** after conversion the corresponding vertical line's position is still `r1.right + 1` and resolves through `r1`'s right line

#### Scenario: Subdivided rectangle keeps its corner region
- **WHEN** a version 3 file has `r2` entirely inside `r1` and an extrude of `r1`
- **THEN** after conversion the extrude references the region at `r1`'s lower-left corner, which excludes `r2`'s area

#### Scenario: Version 4 file
- **WHEN** a version 4 file with lines and no rectangle records is opened
- **THEN** it loads as version 6 with the same lines, no rectangles, and its expressions unchanged

#### Scenario: Version 2 file
- **WHEN** a version 2 file is opened
- **THEN** it loads with its features intact and the default view

#### Scenario: Version 5 file
- **WHEN** a version 5 file is opened
- **THEN** it loads as version 6 with its model unchanged and no sheets
