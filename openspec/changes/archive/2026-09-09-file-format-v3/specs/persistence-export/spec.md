## MODIFIED Requirements

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
