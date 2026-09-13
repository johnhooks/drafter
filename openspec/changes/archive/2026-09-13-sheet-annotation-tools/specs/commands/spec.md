## ADDED Requirements

### Requirement: Sheet tool bindings
The default bindings for the sheet view SHALL be: Select A, Dimension D, Note N, delete selection Delete and Backspace. They SHALL apply only in the sheet view and SHALL be listed and rebindable with every other command.

#### Scenario: Sheet key does not fire in a sketch
- **WHEN** a sketch is open and the user presses N
- **THEN** nothing happens; N is a sheet view command
