## MODIFIED Requirements

### Requirement: Every user-triggered action is a command
Each action the user can start from a key, a toolbar button, or a menu item SHALL be a command with a stable id, a label, the view it applies to (model, sketch, sheet, or all), a rule saying when it is enabled, and an optional default key chord. A control that triggers a command SHALL take its label, its enabled state, and its tooltip, which includes the bound chord when there is one, from the command. Running a command SHALL do exactly what the control did before.

#### Scenario: Tooltip shows the key
- **WHEN** the Select tool is bound to A
- **THEN** the Select button's tooltip reads "Select (A)"

#### Scenario: Disabled command
- **WHEN** nothing can be undone
- **THEN** the Undo button is disabled and pressing its key does nothing

### Requirement: One key handler
A single handler SHALL match each key press against the bindings of commands that apply to the current view and are enabled, and run the first match. A press while a text field, text area, or editable element has focus SHALL be ignored except for Escape, which the field handles itself. A chord SHALL be a key with optional Cmd (Ctrl on other systems), Shift, and Alt, written as `Mod+Shift+Z`, `A`, `Delete`, `1`. A command's key in one view SHALL NOT fire in another.

#### Scenario: Tool key in the sketch
- **WHEN** the sketch view is open with the Rectangle tool active and the user presses A
- **THEN** the Select tool is active

#### Scenario: Key ignored in a field
- **WHEN** a line's Position field has focus and the user presses A
- **THEN** the letter is typed into the field and the tool is unchanged

#### Scenario: View-scoped key
- **WHEN** the sketch view is open and the user presses 1
- **THEN** nothing happens; 1 is a model view command

#### Scenario: Model key in sheets mode
- **WHEN** sheets mode is open and the user presses 1
- **THEN** nothing happens; 1 is a model view command
