## Purpose

Lets the user create sheets, set what each one shows, and place dimensions and notes on it interactively.

## ADDED Requirements

### Requirement: Sheets mode
The app SHALL have a Sheets mode alongside modelling, showing a sheet list with add, rename, reorder, and delete, and the selected sheet drawn as it will print. Deleting a sheet SHALL require confirmation.

#### Scenario: Add sheet
- **WHEN** the user presses Add Sheet with a model present
- **THEN** a new sheet with default settings appears, is selected, and shows the front view

### Requirement: Sheet settings panel
The properties panel for a sheet SHALL edit its name, orientation, view kind, target (whole model or a body chosen from the timeline's bodies), and scale, and SHALL show the sheet's warnings.

#### Scenario: Change view kind
- **WHEN** the user changes the view from front to top
- **THEN** the sheet redraws with the top projection and the title block reads Top

### Requirement: Dimension tool
With the dimension tool active, clicking a first snapped point, then a second, then a position for the dimension line SHALL create a dimension. Orientation SHALL be chosen by the third click: moving mostly perpendicular to the points' u span makes it horizontal, otherwise vertical, with a live preview. Escape SHALL cancel. The tool SHALL be unavailable on isometric sheets.

#### Scenario: Place a horizontal dimension
- **WHEN** the user clicks two corners of a box's bottom edge and then clicks below them
- **THEN** a horizontal dimension of the box's width appears below the box

### Requirement: Note tool
With the note tool active, clicking a position SHALL open a text input at that point; Enter SHALL create the note, Escape SHALL cancel. Shift-dragging from the text position SHALL set a leader endpoint, snapped like a dimension point.

#### Scenario: Place a note
- **WHEN** the user clicks on the sheet, types "3/4 ply", and presses Enter
- **THEN** a note with that text appears at the click position

### Requirement: Select, move, edit, delete annotations
With the select tool active, clicking an annotation SHALL select it; Delete SHALL remove it; dragging a dimension SHALL move its dimension line; dragging a note SHALL move its text; double-clicking a note SHALL edit its text. The properties panel SHALL show the selected annotation's fields for typed editing.

#### Scenario: Move a dimension line
- **WHEN** the user drags a selected dimension's line further from the geometry
- **THEN** the extension lines lengthen and the value is unchanged

### Requirement: Navigation
The sheet view SHALL zoom with the wheel and pan with the middle button or space held, and SHALL have a fit-to-page action.

#### Scenario: Fit to page
- **WHEN** the user presses Fit
- **THEN** the whole page is visible in the view
