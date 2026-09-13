## MODIFIED Requirements

### Requirement: Keyboard and toolbar access
Undo and redo SHALL be commands per `commands`, bound by default to Mod+Z and Mod+Shift+Z, where Mod is Cmd on macOS and Ctrl elsewhere. The keys SHALL be ignored while a text input has focus, where the browser's own text undo applies. The toolbar SHALL show Undo and Redo buttons, disabled when their stack is empty, with tooltips naming the bound chords.

#### Scenario: Keys ignored in a text field
- **WHEN** focus is in the distance field and the user presses Cmd+Z
- **THEN** the document is unchanged and the field's own text undo applies

#### Scenario: Buttons reflect the stacks
- **WHEN** nothing has been edited since the document was opened
- **THEN** both buttons are disabled
