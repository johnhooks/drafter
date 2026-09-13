## MODIFIED Requirements

### Requirement: Sheets mode
The app SHALL have a Sheets mode beside the model view, entered from a Sheets action in the model view's toolbar and left with a Model action, showing a sheet list with add, rename, reorder, and delete, and the selected sheet drawn as it will print. Deleting a sheet SHALL require confirmation. Adding a sheet SHALL offer view selection before confirmation and SHALL be one undo step, as SHALL every other sheet edit. Cancelling creation SHALL NOT add a sheet or consume its default name. Isometric creation SHALL capture the current model camera orientation when confirmed.

#### Scenario: Add sheet
- **WHEN** the user presses Add Sheet with a model present and confirms the default front view
- **THEN** a new sheet with default settings appears, is selected, and shows the front view with a title block

#### Scenario: Cancel creation
- **WHEN** the user opens Add Sheet and cancels
- **THEN** no sheet is created and the next default sheet number is unchanged

#### Scenario: Undo captured view
- **WHEN** the user creates an isometric sheet, undoes creation, and redoes it
- **THEN** the sheet returns with the orientation captured at its original creation

#### Scenario: Reorder
- **WHEN** the user moves Sheet 2 above Sheet 1
- **THEN** the list and the title blocks read Sheet 1 of 2 for the moved sheet and Sheet 2 of 2 for the other

#### Scenario: Delete asks
- **WHEN** the user deletes a sheet and confirms
- **THEN** the sheet is gone and Cmd+Z brings it back

### Requirement: Sheet settings panel
The properties panel for a sheet SHALL edit its name, page orientation, target (whole model or a body chosen from the timeline's bodies), and scale, and SHALL show the sheet's warnings. It SHALL show the committed view kind as read-only and SHALL NOT offer camera direction editing. The scale field SHALL be enabled for isometric sheets and offer the same standard ratios as other sheets. Changing the ratio SHALL change the projected model size on paper without changing the captured orientation or note and leader paper positions.

#### Scenario: Change view kind
- **WHEN** the user wants a top view instead of an existing front sheet, with or without annotations
- **THEN** the front sheet's view direction is read-only and the user creates a separate top sheet

#### Scenario: Scale enabled for isometric
- **WHEN** the user selects an isometric sheet
- **THEN** the scale field is enabled and shows its selected ratio

#### Scenario: Change isometric scale
- **WHEN** the user changes an isometric sheet from 1:4 to 1:8
- **THEN** projected spans halve on paper, the title block and list show 1:8, and note and leader paper positions are unchanged
- **AND** undo restores 1:4 and save/load preserves whichever ratio is selected

### Requirement: Dimension tool
With the dimension tool active, clicking a first snapped point, then a second, then a position for the dimension line SHALL create a dimension. Orientation SHALL be chosen by the third click: moving mostly perpendicular to the points' u span makes it horizontal, otherwise vertical, with a live preview. Escape SHALL cancel at any step. The tool SHALL be unavailable on an isometric sheet, and switching to an isometric sheet while it is active SHALL select the select tool.

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

#### Scenario: Unavailable on isometric
- **WHEN** an isometric sheet is selected
- **THEN** the Dimension button is disabled and D does nothing

#### Scenario: Leaving a dimension placement
- **WHEN** the dimension tool is active and the user selects an isometric sheet
- **THEN** the pending dimension is cancelled and the select tool becomes active

### Requirement: Note tool
With the note tool active, clicking a position SHALL open a text input at that point; Enter SHALL create the note, Escape SHALL cancel. Shift-dragging from the text position SHALL set a leader endpoint, snapped like a dimension point on orthographic sheets and placed directly in paper coordinates on isometric sheets.

#### Scenario: Place a note
- **WHEN** the user clicks on the sheet, types "3/4 ply", and presses Enter
- **THEN** a note with that text appears at the click position

#### Scenario: Isometric leader placement
- **WHEN** the user Shift-drags a note leader on an isometric sheet
- **THEN** the leader ends at the paper position under the pointer, without snapping to raster geometry

### Requirement: Sheet tools switch by key
The sheet tools SHALL be commands in the sheet view: Select A, Dimension D, Note N, following the command rules in `commands`. Dimension D SHALL be unavailable on isometric sheets.

#### Scenario: Dimension tool by key
- **WHEN** an orthographic sheet is selected and the user presses D
- **THEN** the dimension tool is active and its button is selected

#### Scenario: Isometric dimension key does nothing
- **WHEN** an isometric sheet is selected and the user presses D
- **THEN** the active tool is unchanged
