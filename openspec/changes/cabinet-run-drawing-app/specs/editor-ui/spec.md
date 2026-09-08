## Purpose

Lets a user build and adjust a wall run in the browser by adding items through forms, editing them in a properties panel, and editing dimensions directly on the drawing.

## ADDED Requirements

### Requirement: Editor layout
The editor SHALL show: a panel listing the base row and the upper row with their items in order; a drawing area with tabs for elevation, section, and isometric; a properties panel for the selected item or, when nothing is selected, the document settings (title, wall width, ceiling height, defaults); and a warnings list below the drawing showing validation errors and layout warnings.

#### Scenario: Nothing selected shows document settings
- **WHEN** no item is selected
- **THEN** the properties panel shows the title, wall width, ceiling height, and every default as editable fields

### Requirement: Adding items through a form
Each row SHALL have an add form offering the item kinds allowed for that row. Submitting the form SHALL append the item to the row with the kind's default values and select it. Cabinet fronts SHALL get the defaults from `run-document`.

#### Scenario: Add a base cabinet
- **WHEN** the user submits the base row's add form with kind cabinet, type base, width `36`
- **THEN** a 36" base cabinet is appended to the base row and becomes the selected item

### Requirement: Reordering and removing items
Each item in the row list SHALL have controls to move it one position left or right within its row and to remove it. Removing the selected item SHALL clear the selection.

#### Scenario: Move left
- **WHEN** the base row is A, B, C and the user moves C left
- **THEN** the base row is A, C, B and the drawing updates

### Requirement: Properties panel edits the selected item
The properties panel SHALL show every field of the selected item: name, width, and for cabinets and appliances height, depth, and their kind specific fields (upper bottom, appliance type, label, counter flag). Cabinet fronts SHALL be editable as a list: add door or drawer, set drawer height, set door count, reorder, remove. Length fields SHALL accept input per `dimension-units`; an invalid entry SHALL show an error next to the field and leave the stored value unchanged. Fields left blank for height, depth, and upper bottom SHALL mean "use default" and SHALL show the default as a placeholder.

#### Scenario: Invalid width entry
- **WHEN** the user types `abc` into the width field
- **THEN** an error is shown by the field and the item's width is unchanged

#### Scenario: Clearing an override
- **WHEN** the user clears a cabinet's depth field
- **THEN** the cabinet uses the row's depth default and the field shows that default as a placeholder

### Requirement: Selecting from the drawing
Clicking a box in the elevation or isometric view SHALL select that item. Clicking empty drawing area SHALL clear the selection. The selected item SHALL be highlighted in the drawing and in the row list.

#### Scenario: Click selects
- **WHEN** the user clicks the box for item `b2` in the elevation
- **THEN** `b2` is selected, highlighted in the drawing, and shown in the properties panel

### Requirement: Inline editing of dimension labels
In the elevation, clicking an item's width label or a cabinet's height label SHALL replace the label with a text input holding the current value. Enter or leaving the field SHALL commit the value if it parses; Escape SHALL cancel. An invalid entry SHALL keep the input open and show an error. Clicking the overall width label SHALL edit the wall width. Editing the height label of a cabinet that uses the default SHALL set an override on that cabinet only.

#### Scenario: Edit width inline
- **WHEN** the user clicks the `36"` width label of a base cabinet, types `33 1/2`, and presses Enter
- **THEN** the cabinet's width is 33 1/2" and the drawing and row chain update

#### Scenario: Cancel inline edit
- **WHEN** the user opens an inline width edit and presses Escape
- **THEN** the label returns showing the original value and nothing changes

### Requirement: Drawing updates immediately
Every change to the document SHALL re-render the current view and refresh the warnings list without any explicit refresh action.

#### Scenario: Default change re-renders
- **WHEN** the user changes the backsplash default from 18" to 20"
- **THEN** every upper cabinet without a bottom override moves up 2" in the elevation
