## Purpose

Keeps the user's drawing between visits and gets the finished drawings and the document out of the browser as files.

## ADDED Requirements

### Requirement: Autosave to browser storage
The current document SHALL be saved to browser storage after every change and restored when the app is opened. If storage is unavailable or the stored data is invalid, the app SHALL start with a new document and show a notice. A "New document" action SHALL replace the current document with a fresh one after a confirmation.

#### Scenario: Restore on reload
- **WHEN** the user adds a cabinet and reloads the page
- **THEN** the cabinet is still present

#### Scenario: Corrupt storage
- **WHEN** browser storage holds text that is not a valid document
- **THEN** the app opens a new document and shows a notice that the stored drawing could not be read

### Requirement: JSON download and upload
The user SHALL be able to download the document as a JSON file and upload a previously downloaded JSON file to replace the current document. The file SHALL carry a format version. Uploading a file that fails validation SHALL be rejected with an error listing the problems and SHALL leave the current document unchanged.

#### Scenario: Round trip
- **WHEN** a document is downloaded and then uploaded
- **THEN** the resulting document is identical to the original

#### Scenario: Reject invalid file
- **WHEN** a JSON file missing the base row is uploaded
- **THEN** an error is shown and the current document is unchanged

### Requirement: SVG export of the current view
The user SHALL be able to download the current view (elevation, section, or isometric) as a standalone SVG file. The exported SVG SHALL include the document title and SHALL render identically outside the app, with no dependency on app styles.

#### Scenario: Export elevation
- **WHEN** the user exports while the elevation tab is active
- **THEN** a file named from the document title and `elevation` is downloaded and opens as a complete drawing in a browser

### Requirement: Print layout
Printing the page SHALL output only the current drawing and the document title, scaled to fit the page, with the editor panels hidden.

#### Scenario: Print elevation
- **WHEN** the user prints while the elevation tab is active
- **THEN** the printed page contains the title and the elevation only
