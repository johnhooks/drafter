## Purpose

Keeps the model between visits and gets the document, sketches, and 3D view out of the browser as files.

## ADDED Requirements

### Requirement: Autosave to browser storage
The document SHALL be saved to browser storage after every change and restored when the app is opened. If storage is unavailable or the stored data is invalid, the app SHALL start with an empty document and show a notice. A New Document action SHALL replace the current document after confirmation.

#### Scenario: Restore on reload
- **WHEN** the user adds a sketch and an extrude and reloads
- **THEN** both features and the body are present

#### Scenario: Corrupt storage
- **WHEN** browser storage holds text that is not a valid document
- **THEN** the app opens an empty document and shows a notice

### Requirement: JSON download and upload
The user SHALL be able to download the document as JSON and upload a JSON file to replace the current document. The file SHALL carry a format version. Only features are stored; bodies are recomputed on load. A file that fails validation SHALL be rejected with the list of problems and SHALL leave the current document unchanged.

#### Scenario: Round trip
- **WHEN** a document is downloaded and uploaded
- **THEN** the feature list is identical and evaluation produces the same bodies

#### Scenario: Reject invalid file
- **WHEN** a file with an extrude referencing a sketch id that does not exist is uploaded
- **THEN** an error is shown and the current document is unchanged

### Requirement: Sketch SVG export
While editing a sketch, the user SHALL be able to download the sketch view as a standalone SVG containing the rectangles, their dimension labels, and the coplanar reference faces, with no dependency on app styles.

#### Scenario: Export sketch
- **WHEN** the user exports Sketch 2
- **THEN** a file named from the document title and sketch name downloads and opens as a complete drawing in a browser

### Requirement: 3D view PNG export
From the 3D view, the user SHALL be able to download the current rendering as a PNG at the on-screen size or larger.

#### Scenario: Export PNG
- **WHEN** the user exports the 3D view
- **THEN** a PNG file downloads showing the same rendering
