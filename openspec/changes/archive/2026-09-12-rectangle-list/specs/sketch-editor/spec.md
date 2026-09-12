## ADDED Requirements

### Requirement: Rectangle and region lists
The sketch properties SHALL list the sketch's rectangles first, one entry per rectangle record in sketch order, reading as the rectangle's handle with its width and height, with its lower-left position and the handles of its four member lines as detail. A rectangle whose members do not all resolve SHALL still be listed, in an error style, with the failing line's message as detail. Choosing a rectangle in the list SHALL select its four member lines, which are highlighted in the view as selected lines, and a rectangle SHALL read as selected in the list while all four of its member lines are selected. The sketch's regions SHALL be listed separately, each reading "Region" with its bounding size and, as detail, its lower-left position, the handles of the lines that bound it, and the handle of the rectangle it fills exactly if there is one. Selecting a region in the list SHALL select the region in the view and the reverse. The lines SHALL be listed separately, collapsed by default, with each line's handle, direction, and error if any.

#### Scenario: A rectangle is listed with its members
- **WHEN** a sketch holds `r1`, 24" by 16", drawn with the Rectangle tool
- **THEN** the rectangle list has one entry, "r1 24" x 16"", naming lines l1 l2 l3 l4, and the region list has one "Region 24" x 16"" entry whose detail names `r1`

#### Scenario: A split rectangle stays listed
- **WHEN** a line splits `r1` across
- **THEN** the rectangle list still has "r1 24" x 16"" and the region list has two "Region" entries, neither naming a rectangle

#### Scenario: Choosing a rectangle selects its sides
- **WHEN** the user chooses `r1` in the rectangle list
- **THEN** its four member lines are selected, highlighted in the view, and `r1` reads as selected in the list

#### Scenario: Region list follows the view
- **WHEN** the user clicks a region in the view
- **THEN** the same region is selected in the region list

## MODIFIED Requirements

### Requirement: Typed line fields
The properties panel for a selected line SHALL show its direction, its position, and its run min, max, and size with the derived one marked, a construction checkbox, and a delete action, with the same parsing and error rules as inline editing. When the line is a member of a rectangle, the rectangle's form per `sketch-rectangles` SHALL be shown above it with the member's side marked. When exactly four lines are selected that are not already a rectangle's members, a Make rectangle action SHALL be offered; four lines that are a rectangle's members SHALL show that rectangle's form instead, per `sketch-rectangles`.

#### Scenario: Move by typing position
- **WHEN** the user sets a horizontal line's position to `12` in the panel
- **THEN** the line moves to v 12" and its endpoints are unchanged

#### Scenario: Member line shows the rectangle
- **WHEN** the user selects the right line of `r1`
- **THEN** the panel shows `r1`'s form with Right marked, then the line's own fields

#### Scenario: Four loose lines offer Make rectangle
- **WHEN** four attached lines that form a closed outline but belong to no rectangle are selected
- **THEN** the panel offers Make rectangle

## REMOVED Requirements

### Requirement: Shape list
**Reason**: Listing regions as shapes hid every rectangle that a line subdivides, which in practice is most of them.
**Migration**: Rectangles are listed in their own list; regions are listed as regions with the rectangle they fill in their detail. Tests and documentation that address the "Shapes" list address "Regions".
