## Purpose

Defines commands as the one way the user triggers an action, how keys and controls invoke them, the default key bindings, and how bindings are changed.

## ADDED Requirements

### Requirement: Every user-triggered action is a command
Each action the user can start from a key, a toolbar button, or a menu item SHALL be a command with a stable id, a label, the view it applies to (model, sketch, or both), a rule saying when it is enabled, and an optional default key chord. A control that triggers a command SHALL take its label, its enabled state, and its tooltip, which includes the bound chord when there is one, from the command. Running a command SHALL do exactly what the control did before.

#### Scenario: Tooltip shows the key
- **WHEN** the Select tool is bound to A
- **THEN** the Select button's tooltip reads "Select (A)"

#### Scenario: Disabled command
- **WHEN** nothing can be undone
- **THEN** the Undo button is disabled and pressing its key does nothing

### Requirement: One key handler
A single handler SHALL match each key press against the bindings of commands that apply to the current view and are enabled, and run the first match. A press while a text field, text area, or editable element has focus SHALL be ignored except for Escape, which the field handles itself. A chord SHALL be a key with optional Cmd (Ctrl on other systems), Shift, and Alt, written as `Mod+Shift+Z`, `A`, `Delete`, `1`. A command's key in one view SHALL NOT fire in the other.

#### Scenario: Tool key in the sketch
- **WHEN** the sketch view is open with the Rectangle tool active and the user presses A
- **THEN** the Select tool is active

#### Scenario: Key ignored in a field
- **WHEN** a line's Position field has focus and the user presses A
- **THEN** the letter is typed into the field and the tool is unchanged

#### Scenario: View-scoped key
- **WHEN** the sketch view is open and the user presses 1
- **THEN** nothing happens; 1 is a model view command

### Requirement: Default bindings
The default bindings SHALL be: Select A, Line L, Rectangle R, Link D; construction X; delete selection Delete and Backspace; undo Mod+Z, redo Mod+Shift+Z; front, back, left, right, top, bottom 1 to 6; default isometric Home; fit F; cancel and clear Escape; keyboard shortcuts Mod+/. Tool and sketch commands apply to the sketch view; view commands to the model view; undo, redo, Escape, and keyboard shortcuts to both.

#### Scenario: Line tool by key
- **WHEN** the user presses L in a sketch
- **THEN** the Line tool is active and its button is selected

### Requirement: Bindings can be viewed and changed
A Keyboard shortcuts dialog SHALL list every command with its chord and the view it applies to. It SHALL open from a Keyboard shortcuts item in the More menu and from the keyboard shortcuts command, bound to Mod+/ by default, in both the model and the sketch view. Selecting a command and committing a chord in its field SHALL rebind it; a chord already bound to another command in the same view SHALL be refused with a message naming that command; an empty field SHALL unbind. A Reset action SHALL restore the defaults. Bindings SHALL be remembered in the browser across reloads and documents and SHALL NOT be part of the document file.

#### Scenario: Open from a sketch
- **WHEN** a sketch is open and the user presses Mod+/
- **THEN** the Keyboard shortcuts dialog opens listing Select with A

#### Scenario: Rebind
- **WHEN** the user sets Select to V and reloads
- **THEN** V selects the Select tool, A does nothing, and the Select button's tooltip reads "Select (V)"

#### Scenario: Conflict refused
- **WHEN** the user sets Line to A while Select is A
- **THEN** the change is refused with a message naming Select and Line stays L

#### Scenario: Same key in different views
- **WHEN** the user sets Fit to A
- **THEN** it is accepted, because Fit is a model view command and Select is a sketch command
