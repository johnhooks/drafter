# undo-redo Specification

## Purpose
Lets the user step back through document changes and forward again, one gesture at a time, without touching what they were looking at.

## Requirements

### Requirement: Every document change is undoable
Any action that changes the document SHALL push the previous document onto the undo stack and clear the redo stack. Undo SHALL restore the previous document and push the current one onto the redo stack; redo SHALL do the reverse. Undo and redo SHALL re-evaluate the timeline like any edit.

#### Scenario: Undo an extrude distance
- **WHEN** the user changes Extrude 1's distance from 24" to 30" and presses Cmd+Z
- **THEN** the distance is 24" again and the body is 24" deep

#### Scenario: Redo after undo
- **WHEN** the user undoes that change and presses Cmd+Shift+Z
- **THEN** the distance is 30" again

#### Scenario: New edit clears redo
- **WHEN** the user undoes, then makes a different edit
- **THEN** redo is unavailable

### Requirement: One entry per gesture
Each of the following SHALL be a single undo entry: drawing a rectangle, committing an inline dimension, committing a properties field, a link tool commit, deleting rectangles, deleting a feature with its cascade, adding a feature, renaming a parameter including every rewritten expression, adding or deleting a parameter. Consecutive edits to the same text field (feature name, title, parameter name) within two seconds SHALL coalesce into one entry.

#### Scenario: Cascade delete is one entry
- **WHEN** the user deletes Extrude 1, which removes Sketch 2 and Extrude 2, and presses Cmd+Z
- **THEN** all three features are back

#### Scenario: Typing a name is one entry
- **WHEN** the user types "Carcass" into a sketch's name field one character at a time and presses Cmd+Z once
- **THEN** the name is what it was before typing began

### Requirement: Keyboard and toolbar access
Cmd+Z on macOS or Ctrl+Z elsewhere SHALL undo; with Shift added SHALL redo. The keys SHALL be ignored while a text input has focus, where the browser's own text undo applies. The toolbar SHALL show Undo and Redo buttons, disabled when their stack is empty, with tooltips naming the keys.

#### Scenario: Keys ignored in a text field
- **WHEN** focus is in the distance field and the user presses Cmd+Z
- **THEN** the document is unchanged and the field's own text undo applies

#### Scenario: Buttons reflect the stacks
- **WHEN** nothing has been edited since the document was opened
- **THEN** both buttons are disabled

### Requirement: View state is not on the stack
Undo and redo SHALL NOT change selection, tool, pan, zoom, or notices, except that if the document restored by undo or redo no longer contains the sketch being edited, the app SHALL return to the model view, and any selected id that no longer exists SHALL be cleared.

#### Scenario: Undo while editing a sketch that survives
- **WHEN** the user is editing Sketch 2, undoes a rectangle, and the sketch still exists
- **THEN** the sketch editor stays open on Sketch 2

#### Scenario: Undo removes the sketch being edited
- **WHEN** the user is editing Sketch 2 and undoes the action that created it
- **THEN** the app returns to the model view

### Requirement: History boundaries
Opening a file, starting a new document, and restoring from browser storage on load SHALL clear both stacks. The undo stack SHALL keep at most 200 entries, dropping the oldest. History SHALL NOT be saved.

#### Scenario: Opening a file clears history
- **WHEN** the user edits, then opens a JSON file
- **THEN** undo is unavailable
