## MODIFIED Requirements

### Requirement: Typed line fields
The Selection panel for a selected line SHALL show its direction, its position, and its run min, max, and size with the derived one marked, a construction checkbox, and a delete action, with the same parsing and error rules as inline editing. These primary fields SHALL be visible without an additional object disclosure when the panel is expanded. When the line belongs to a rectangle, the panel SHALL identify the parent and provide an action selecting its four member lines to show the rectangle form per `sketch-rectangles`, rather than automatically showing that form above the line. When exactly four lines are selected that are not already a rectangle's members, a Make rectangle action SHALL be offered; four lines that are a rectangle's members SHALL show that rectangle's form instead.

#### Scenario: Move by typing position
- **WHEN** the user sets a horizontal line's position to `12` in the panel
- **THEN** the line moves to v 12" and its endpoints are unchanged

#### Scenario: Member line identifies its rectangle
- **WHEN** the user selects the right line of `r1`
- **THEN** the panel immediately shows the line's own fields and a parent action for `r1`
- **AND** the parent rectangle form is not automatically expanded above them

#### Scenario: Member line shows the rectangle
- **WHEN** the user selects a member line and activates its parent rectangle action
- **THEN** the parent rectangle is selected and its form replaces the line fields

#### Scenario: Four loose lines offer Make rectangle
- **WHEN** four attached lines that form a closed outline but belong to no rectangle are selected
- **THEN** the panel offers Make rectangle

### Requirement: Selection pane
While editing a sketch, its fields, its entity lists, and Selection SHALL be independently manageable dock panels per `workspace-docks`; Selection SHALL NOT be fixed beneath the entity lists. Rectangles, Regions, Lines, and Constraints SHALL retain their list behavior and at-most-one-open accordion inside the entity-list panel, with Regions initially open. Object inspection SHALL NOT add another disclosure around the selected object's primary form.

Selection SHALL show the rectangle form for four selected member lines or a region that fills a rectangle; the line form for a single line; the Make rectangle action for four selected lines that are not a rectangle; counts for other line or region selections; and a nothing-selected hint otherwise. A selected constraint SHALL take precedence over retained line or region selection, showing its target line and slot, editable expression, resolved value or error, removal action, and an action to inspect the target line. Existing expression validation and constraint removal behavior SHALL apply. Switching to line inspection SHALL clear the selected constraint. Changing selected content SHALL NOT change panel allocation or automatically open a folded panel or dock. Scrolling lists and selection content SHALL retain their overflow fades.

#### Scenario: Nothing selected
- **WHEN** a sketch is open, Selection is expanded, and nothing is selected
- **THEN** Selection shows a hint and no fields

#### Scenario: A line is selected
- **WHEN** the user clicks a line in the view while Selection is expanded
- **THEN** its fields appear directly and the lists do not change size

#### Scenario: A rectangle is chosen from the list
- **WHEN** the user chooses `r1` in the rectangle list
- **THEN** the expanded Selection panel shows `r1`'s form

#### Scenario: Independent placement and resize
- **WHEN** the user moves Selection to the opposite dock and resizes it
- **THEN** it inspects the same selection and follows the dock sizing and persistence rules

#### Scenario: Scroll fade
- **WHEN** the open list holds more rows than fit
- **THEN** it fades at the bottom, and after scrolling to the end it fades at the top instead

#### Scenario: Minimize the sketch window
- **WHEN** the user folds the sketch settings panel
- **THEN** only its header remains and other expanded panels in its dock gain the released space

#### Scenario: One list at a time
- **WHEN** Regions is open and the user opens Lines
- **THEN** Lines is open and Regions is closed

#### Scenario: Inspect a constraint with a retained line selection
- **WHEN** a line is selected and the user chooses a constraint from the list
- **THEN** Selection shows that constraint's target, expression, result or error, and removal action rather than the retained line form

#### Scenario: Return from constraint to line
- **WHEN** the user activates the constraint inspector's target-line action
- **THEN** the target line is selected, the constraint selection is cleared, and the line fields appear

#### Scenario: Divider dragged and remembered
- **WHEN** the user grows Selection by 80 px within the available limits and reloads at the same viewport size
- **THEN** its preferred allocation is restored and it remains 80 px taller than before

#### Scenario: Divider by keyboard and reset
- **WHEN** the user focuses a divider, uses an arrow key to change the allocation, then double-clicks it
- **THEN** the neighboring expanded panels resize by one step and then the dock returns to its default allocation
