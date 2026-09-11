# persistence-export Specification

## Purpose
Keeps the model between visits and gets the document, sketches, and 3D view out of the browser as files.

## Requirements

### Requirement: Autosave to browser storage
The file, model and view, SHALL be saved to browser storage after every change to either part and restored when the app is opened. If storage is unavailable or the stored data is invalid, the app SHALL start with an empty file and show a notice. A New Document action SHALL replace the current file after confirmation.

#### Scenario: Restore on reload
- **WHEN** the user adds a sketch and an extrude, rotates the view, and reloads
- **THEN** both features, the body, and the camera are present

#### Scenario: Corrupt storage
- **WHEN** browser storage holds text that is not a valid file
- **THEN** the app opens an empty file and shows a notice

### Requirement: JSON download and upload
The user SHALL be able to download the file as JSON and upload a JSON file to replace the current one. The file SHALL carry a format version. Only the model's features and parameters and the view are stored; bodies are recomputed on load. A file that fails validation SHALL be rejected with the list of problems and SHALL leave the current file unchanged.

#### Scenario: Round trip
- **WHEN** a file is downloaded and uploaded
- **THEN** the model is identical, evaluation produces the same bodies, and the camera is the same

#### Scenario: Reject invalid file
- **WHEN** a file with an extrude referencing a sketch id that does not exist is uploaded
- **THEN** an error is shown and the current file is unchanged

### Requirement: Sketch SVG export
While editing a sketch, the user SHALL be able to download the sketch view as a standalone SVG containing the rectangles, their dimension labels, and the coplanar reference faces, with no dependency on app styles. The file SHALL carry the colours the view was drawn with under the current theme, as literal values, and a background in the canvas surface colour, so it reads as it did on screen.

#### Scenario: Export sketch
- **WHEN** the user exports Sketch 2
- **THEN** a file named from the document title and sketch name downloads and opens as a complete drawing in a browser

#### Scenario: Export from the dark theme
- **WHEN** the dark theme is chosen and the user exports a sketch
- **THEN** the file has a background rectangle in the dark canvas colour and its lines use the dark theme's line colour

### Requirement: 3D view PNG export
From the 3D view, the user SHALL be able to download the current rendering as a PNG at the on-screen size or larger.

#### Scenario: Export PNG
- **WHEN** the user exports the 3D view
- **THEN** a PNG file downloads showing the same rendering
