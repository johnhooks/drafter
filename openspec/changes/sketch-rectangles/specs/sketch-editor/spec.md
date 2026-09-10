## MODIFIED Requirements

### Requirement: Typed line fields
The properties panel for a selected line SHALL show its direction, its position, and its run min, max, and size with the derived one marked, a construction checkbox, and a delete action, with the same parsing and error rules as inline editing. When the line is a member of a rectangle, the rectangle's form per `sketch-rectangles` SHALL be shown above it with the member's side marked. When exactly four lines are selected, a Make rectangle action SHALL be offered.

#### Scenario: Move by typing position
- **WHEN** the user sets a horizontal line's position to `12` in the panel
- **THEN** the line moves to v 12" and its endpoints are unchanged

#### Scenario: Member line shows the rectangle
- **WHEN** the user selects the right line of `r1`
- **THEN** the panel shows `r1`'s form with Right marked, then the line's own fields

### Requirement: Shape list
The sketch properties SHALL list the sketch's regions as shapes: a region that is exactly the area of a rectangle record SHALL read as that rectangle's handle with its size, any other region "Region" with its bounding size, each with the handles of the lines that bound it. Selecting a shape in the list SHALL select the region in the view and the reverse. The lines SHALL be listed separately, collapsed by default, with each line's handle, direction, and error if any.

#### Scenario: A rectangle reads as one shape
- **WHEN** a sketch holds `r1`, 24" by 16", drawn with the Rectangle tool
- **THEN** the shape list has one entry, "r1 24" x 16"", naming lines l1 l2 l3 l4

#### Scenario: A split rectangle is two regions
- **WHEN** a line splits `r1` across
- **THEN** the shape list has two "Region" entries and `r1` still exists with its form

#### Scenario: Shape list follows the view
- **WHEN** the user clicks a region in the view
- **THEN** the same shape is selected in the list
