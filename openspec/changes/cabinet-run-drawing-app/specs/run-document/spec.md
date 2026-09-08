## Purpose

Defines what a wall run drawing consists of: the wall, shared defaults, two rows of items, and the fronts on each cabinet, so that the editor, layout, and file format all agree on one structure.

## ADDED Requirements

### Requirement: A document describes one wall run
A document SHALL contain: a title, a wall width, a ceiling height, a set of defaults, a base row, and an upper row. Each row SHALL be an ordered list of items. All lengths SHALL be stored per `dimension-units`.

#### Scenario: New document
- **WHEN** a new document is created
- **THEN** it has an empty base row, an empty upper row, a wall width of 120", a ceiling height of 96", and the default values listed below

### Requirement: Defaults are shared by all items unless overridden
The document defaults SHALL include: base cabinet height (34 1/2"), base depth (24"), toe kick height (4"), toe kick recess (3"), counter thickness (1 1/2"), counter overhang (1 1/2"), backsplash height (18"), upper depth (12"), upper height (30"), tall depth (24"), tall height (84"), and front reveal (1/8"). A cabinet field left unset SHALL take the matching default at layout time; a cabinet field that is set SHALL override it for that cabinet only.

#### Scenario: Changing a default updates unset cabinets
- **WHEN** the base depth default is changed from 24" to 21" and a base cabinet has no depth override
- **THEN** that cabinet's resolved depth becomes 21"

#### Scenario: Override survives a default change
- **WHEN** a base cabinet has its depth set to 12" and the base depth default changes to 21"
- **THEN** that cabinet's resolved depth stays 12"

### Requirement: Rows accept specific item kinds
The base row SHALL accept items of kind cabinet (type base or tall), appliance, filler, and space. The upper row SHALL accept items of kind cabinet (type upper), filler, and space. The system SHALL reject an item of the wrong kind or type for a row.

#### Scenario: Upper cabinet in base row is rejected
- **WHEN** a cabinet of type upper is added to the base row
- **THEN** the document reports a validation error naming the item and the row

### Requirement: Every item has a name and a width
Every item SHALL have a unique id, a display name, and a width greater than zero. Names need not be unique. Cabinets and appliances SHALL additionally have a height and a depth, each either unset (use default) or a length greater than zero. Fillers SHALL have only a width. Space items SHALL have only a width and SHALL draw nothing.

#### Scenario: Zero width is rejected
- **WHEN** an item's width is set to 0
- **THEN** the document reports a validation error for that item

### Requirement: Upper cabinets have an adjustable bottom height
An upper cabinet SHALL have an optional bottom height measured from the floor. When unset, the bottom SHALL be the base height default plus the counter thickness default plus the backsplash default.

#### Scenario: Default upper bottom
- **WHEN** an upper cabinet has no bottom override and the defaults are unchanged
- **THEN** its resolved bottom is 54" from the floor

### Requirement: Appliances have a type, a label, and a counter flag
An appliance SHALL have a type of range, dishwasher, refrigerator, or other, a label shown on the drawing, and a flag saying whether the counter runs over it. New appliances SHALL take these defaults by type: range 30" wide, 36" high, 25" deep, counter does not run over; dishwasher 24" wide, 34 1/2" high, 24" deep, counter runs over; refrigerator 36" wide, 70" high, 30" deep, counter does not run over; other 24" wide, 34 1/2" high, 24" deep, counter runs over.

#### Scenario: Adding a dishwasher
- **WHEN** an appliance of type dishwasher is added
- **THEN** it has width 24", height 34 1/2", depth 24", label "DW", and the counter runs over it

### Requirement: Cabinets have a stack of fronts
A cabinet SHALL have an ordered list of fronts from top to bottom. A front SHALL be either a door with a count of one or two, or a drawer with a height. Every front except the last SHALL have a height; the last front SHALL fill the cabinet's remaining height. A cabinet with an empty fronts list SHALL draw as an open box. New base cabinets SHALL start with one drawer of 6" over one double door if wider than 24", otherwise a single door. New upper and tall cabinets SHALL start with a single door, or a double door if wider than 24".

#### Scenario: Last front fills remainder
- **WHEN** a 34 1/2" base cabinet has a 6" drawer followed by a door
- **THEN** the door's resolved height is 28 1/2"

#### Scenario: Fronts exceed cabinet height
- **WHEN** the explicit front heights sum to more than the cabinet height
- **THEN** the document reports a validation error for that cabinet

### Requirement: Document validation lists every problem
Validating a document SHALL return a list of errors, each naming the item or field at fault. A document with errors SHALL still be editable and SHALL still lay out using the last valid values.

#### Scenario: Multiple errors reported together
- **WHEN** two items have zero width
- **THEN** validation returns two errors, one per item
