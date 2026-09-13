## Purpose

Lets the user create sheets, set what each one shows, and move around the page.

## ADDED Requirements

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
