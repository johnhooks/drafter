# sheet-editor Specification

## Purpose

Lets the user create sheets, set what each one shows, and move around the page.

## Requirements

### Requirement: Sheets mode
The app SHALL have a Sheets mode beside the model view, entered from a Sheets action in the model view's toolbar and left with a Model action, showing a sheet list with add, rename, reorder, and delete, and the selected sheet drawn as it will print. Deleting a sheet SHALL require confirmation. Adding a sheet SHALL be one undo step, as SHALL every other sheet edit.

#### Scenario: Add sheet
- **WHEN** the user presses Add Sheet with a model present
- **THEN** a new sheet with default settings appears, is selected, and shows the front view with a title block

#### Scenario: Reorder
- **WHEN** the user moves Sheet 2 above Sheet 1
- **THEN** the list and the title blocks read Sheet 1 of 2 for the moved sheet and Sheet 2 of 2 for the other

#### Scenario: Delete asks
- **WHEN** the user deletes a sheet and confirms
- **THEN** the sheet is gone and Cmd+Z brings it back

### Requirement: Sheet settings panel
The properties panel for a sheet SHALL edit its name, orientation, view kind, target (whole model or a body chosen from the timeline's bodies), and scale, and SHALL show the sheet's warnings.

#### Scenario: Change view kind
- **WHEN** the user changes the view from front to top
- **THEN** the sheet redraws with the top projection and the title block reads Top

### Requirement: Navigation
The sheet view SHALL zoom with the wheel and pan with the middle button or space held, and SHALL have a fit-to-page action bound to the fit command.

#### Scenario: Fit to page
- **WHEN** the user presses Fit
- **THEN** the whole page is visible in the view

### Requirement: Commands in sheets mode
Commands whose view is all, and the fit command, SHALL apply in sheets mode; model and sketch commands SHALL NOT. Escape in sheets mode SHALL clear the selection.

#### Scenario: Undo applies
- **WHEN** the user renames a sheet and presses Cmd+Z in sheets mode
- **THEN** the old name is back

### Requirement: Dimension tool
With the dimension tool active, clicking a first snapped point, then a second, then a position for the dimension line SHALL create a dimension. Orientation SHALL be chosen by the third click: moving mostly perpendicular to the points' u span makes it horizontal, otherwise vertical, with a live preview. Escape SHALL cancel at any step.

Confirmed points and the projected segments containing them SHALL be highlighted using the existing blue canvas selection colour until the dimension is created, cancelled, or the tool changes. Each confirmed point SHALL have a small marker, including points placed on the grid. These temporary highlights SHALL NOT appear in printed or exported drawings.

#### Scenario: Keep picked geometry highlighted
- **WHEN** the user clicks the first and second dimension points, then moves the pointer to position the dimension
- **THEN** both confirmed points and their incident projected segments stay highlighted, without highlighting the unconfirmed placement point
- **AND** completion, Escape, or switching tools removes the highlights

#### Scenario: Output excludes placement highlights
- **WHEN** a sheet is printed or exported while dimension placement is in progress
- **THEN** neither the point markers nor the picked-geometry highlight appears in the output

#### Scenario: Place a horizontal dimension
- **WHEN** the user clicks two corners of a box's bottom edge and then clicks below them
- **THEN** a horizontal dimension of the box's width appears below the box

### Requirement: Note tool
With the note tool active, clicking a position SHALL open a text input at that point; Enter SHALL create the note, Escape SHALL cancel. Shift-dragging from the text position SHALL set a leader endpoint, snapped like a dimension point.

#### Scenario: Place a note
- **WHEN** the user clicks on the sheet, types "3/4 ply", and presses Enter
- **THEN** a note with that text appears at the click position

### Requirement: Select, move, edit, delete annotations
With the select tool active, clicking an annotation SHALL select it; Delete SHALL remove it; dragging a dimension SHALL move its dimension line; dragging a note SHALL move its text; double-clicking a note SHALL edit its text. The properties panel SHALL show the selected annotation's fields for typed editing. Every edit SHALL be one undo step.

Annotation hit targets SHALL follow their strokes and text, not the empty area enclosed by their bounds.

#### Scenario: Pick an inner dimension
- **WHEN** two dimensions share endpoints and the later dimension is farther from the geometry
- **THEN** clicking or dragging the inner dimension's visible label selects or moves the inner dimension, not the outer one

#### Scenario: Move a dimension line
- **WHEN** the user drags a selected dimension's line further from the geometry
- **THEN** the extension lines lengthen and the value is unchanged

#### Scenario: Delete a note
- **WHEN** the user selects a note and presses Delete
- **THEN** the note is gone and Cmd+Z brings it back

### Requirement: Sheet tools switch by key
The sheet tools SHALL be commands in the sheet view: Select A, Dimension D, Note N, following the command rules in `commands`.

#### Scenario: Dimension tool by key
- **WHEN** sheets mode is open and the user presses D
- **THEN** the dimension tool is active and its button is selected
