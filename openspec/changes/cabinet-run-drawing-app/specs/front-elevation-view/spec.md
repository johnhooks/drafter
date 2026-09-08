## Purpose

Draws the run as seen from the front, with fronts, counter, and toe kick, and enough automatic dimensions for a builder to size every box.

## ADDED Requirements

### Requirement: Elevation draws every box at scale
The elevation SHALL be an SVG whose user units are inches, drawn with y up from the floor, showing the wall extents, floor line, ceiling line, every box outline, the counter segments, and the toe kick segments. Space items SHALL leave a blank area. Appliances SHALL draw as a dashed outline with their label centred.

#### Scenario: Wall extents present
- **WHEN** a document with a 120" wall and 96" ceiling is rendered
- **THEN** the SVG contains a floor line and a ceiling line 120" long and vertical wall lines 96" tall

### Requirement: Fronts are drawn inside cabinets
Within each cabinet box, fronts SHALL be drawn top to bottom in order with the front reveal default as the gap between and around them. A double door SHALL be split into two equal leaves with a reveal between. Drawers SHALL be drawn as a rectangle with a centred horizontal pull mark. Doors SHALL be drawn as a rectangle with a small vertical pull mark near the opening edge.

#### Scenario: Drawer over double door
- **WHEN** a 36" base with a 6" drawer over a double door is rendered
- **THEN** the SVG contains one drawer rectangle across the top and two door rectangles of equal width below it

### Requirement: Widths are dimensioned as a chain
The elevation SHALL draw a chained width dimension for the base row below the floor line and for the upper row above the highest box, one segment per item including fillers and space. A single overall wall width dimension SHALL be drawn above the row chains. Every dimension SHALL show its length formatted per `dimension-units`.

#### Scenario: Base row chain
- **WHEN** the base row is 36", 24", and 36"
- **THEN** the elevation has three chained segments labelled `36"`, `24"`, `36"` under the floor and an overall dimension labelled `120"` when the wall is 120"

### Requirement: Heights are dimensioned on the right
The elevation SHALL draw, to the right of the run, dimensions for: toe kick height, base cabinet height, counter top height from the floor, upper bottom height from the floor, upper top height, and ceiling height. A height dimension SHALL be omitted if nothing in the run uses it (for example, no upper row means no upper dimensions).

#### Scenario: Default heights
- **WHEN** a run with one base and one upper is rendered with default values
- **THEN** the right side shows `4"`, `34 1/2"`, `36"`, `54"`, `84"`, and `96"`

### Requirement: Drawing elements are addressable
Every box and every width or height dimension label SHALL carry a stable identifier (the item id and the dimension kind) so that an editor can map a click on the drawing back to the item and field.

#### Scenario: Box carries item id
- **WHEN** an item with id `b1` is rendered
- **THEN** its box element and its width dimension label both reference `b1`
