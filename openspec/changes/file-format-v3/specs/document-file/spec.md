## Purpose

Defines the saved file as a model plus how it was being viewed, so that undo covers only the model and a file opens where it was left.

## ADDED Requirements

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
Version 1 and 2 files SHALL load, be converted to version 3 with a default view, and be saved as version 3.

#### Scenario: Version 2 file
- **WHEN** a version 2 file is opened
- **THEN** it loads with its features intact and the default view
