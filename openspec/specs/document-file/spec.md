# document-file Specification

## Purpose
Defines the saved file as a model plus how it was being viewed, so that undo covers only the model and a file opens where it was left.

## Requirements

### Requirement: A file holds a model and a view
A saved file SHALL contain a version, a `model` with the title, parameters, and features, and a `view` with display state. The `view` SHALL hold the camera as orbit azimuth and elevation in degrees, an orthographic zoom, and a centre point in sixteenths, and MAY hold the id of the sketch open for editing. The view SHALL NOT affect evaluation.

#### Scenario: Both parts saved
- **WHEN** the user rotates the view, then adds a rectangle, then downloads the file
- **THEN** the file's `view` holds the rotated camera and its `model` holds the rectangle

### Requirement: Undo covers the model only
Changing the view SHALL NOT create an undo entry, and undo or redo SHALL NOT change the view.

#### Scenario: Rotate, edit, undo
- **WHEN** the user rotates the view, changes an extrude distance, and presses Cmd+Z
- **THEN** the distance is restored and the view is unchanged

### Requirement: Loading restores the view
Opening a file or restoring from browser storage SHALL set the camera from `view` and, if `view` names a sketch that exists in the model, open that sketch for editing; otherwise the model view SHALL open. A file without a `view` SHALL open at the default camera in the model view.

#### Scenario: Reload lands in the sketch
- **WHEN** the user is editing Sketch 2 with a rotated camera and reloads
- **THEN** Sketch 2 is open again and, on Finish, the camera is where it was

#### Scenario: Stale sketch id
- **WHEN** a file's `view` names a sketch id that is not in its model
- **THEN** the model view opens and no error is shown

### Requirement: Earlier versions load
Version 1, 2, and 3 files SHALL load, be converted to version 4, and be saved as version 4. Converting a version 3 model SHALL turn each rectangle into four lines attached at their endpoints, with the rectangle's driven slots becoming the lines' positions (a driven size becoming the far line's position as an expression over the near line), assign line handles in order, rewrite every expression that named a rectangle property to the equivalent line expression, turn each extrude's rectangle ids into references to the region at each rectangle's lower-left corner, turn each face reference into the matching cap, base, or side reference, and carry dimension placements to the corresponding line slots and region labels. An extrude of a rectangle that other rectangles' lines subdivide SHALL reference only the region at that rectangle's lower-left corner; the other parts are not extruded until the user adds them.

#### Scenario: Version 3 rectangle
- **WHEN** a version 3 file with a rectangle `r1` with u min 0, u max 384, v min 0, v max 384 and an extrude of `r1` is opened
- **THEN** it loads as version 4 with four attached lines enclosing that square and an extrude referencing the region at the corner of its left and bottom lines, and evaluates to the same body

#### Scenario: Version 3 expressions
- **WHEN** a version 3 rectangle `r2` has u min `r1.right + 1`
- **THEN** after conversion the corresponding vertical line's position is `<r1's right line>.at + 1`

#### Scenario: Subdivided rectangle keeps its corner region
- **WHEN** a version 3 file has `r2` entirely inside `r1` and an extrude of `r1`
- **THEN** after conversion the extrude references the region at `r1`'s lower-left corner, which excludes `r2`'s area

#### Scenario: Version 2 file
- **WHEN** a version 2 file is opened
- **THEN** it loads with its features intact and the default view
