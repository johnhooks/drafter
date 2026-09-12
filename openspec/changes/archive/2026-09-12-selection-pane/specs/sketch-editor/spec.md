## ADDED Requirements

### Requirement: Selection pane
While the properties column shows a sketch, it SHALL be three windows: the sketch's fields at the top, with a control in its title bar that minimizes it to the bar and restores it, the lists in the middle taking whatever height the other two leave, and a Selection pane at the bottom that is always present and scrolls on its own, separated from the lists by a divider. The lists, Rectangles, Regions, Lines, and Constraints, SHALL be an accordion with at most one open, Regions open to start; the open list SHALL take the remaining height of its window and scroll on its own. The pane SHALL show the form for the current selection: the rectangle form for four selected member lines or a region that fills a rectangle; the rectangle form above the line form for a single member line; the line form for any other single line; the Make rectangle action for four selected lines that are not a rectangle; a count of selected lines or regions for any other selection; and a hint saying nothing is selected otherwise. The pane's height SHALL NOT change with the length of the lists or the selection. Dragging the divider SHALL set the pane's height between a minimum that keeps the pane usable and a maximum that keeps the sketch region visible; the divider SHALL be focusable and the up and down arrow keys SHALL change the height in steps; double-clicking it SHALL restore the default height. The height SHALL be remembered across sessions. A scrolling list or pane SHALL show a fade at its top edge while content is scrolled past it and at its bottom edge while content extends below it.

#### Scenario: Nothing selected
- **WHEN** a sketch is open and nothing is selected
- **THEN** the Selection pane is shown with a hint and no fields

#### Scenario: A line is selected
- **WHEN** the user clicks a line in the view
- **THEN** the line's form appears in the Selection pane and the lists above do not move

#### Scenario: A rectangle is chosen from the list
- **WHEN** the user chooses `r1` in the rectangle list
- **THEN** `r1`'s form appears in the Selection pane

#### Scenario: Divider dragged and remembered
- **WHEN** the user drags the divider up by 80 px and reloads
- **THEN** the pane is 80 px taller than before, and still is after the reload

#### Scenario: Divider by keyboard and reset
- **WHEN** the user focuses the divider, presses the down arrow, then double-clicks it
- **THEN** the pane first shrinks by one step and then returns to the default height

#### Scenario: Scroll fade
- **WHEN** the open list holds more rows than fit
- **THEN** it fades at the bottom, and after scrolling to the end it fades at the top instead

#### Scenario: Minimize the sketch window
- **WHEN** the user presses the minimize control in the sketch window's title bar
- **THEN** only the title bar remains, the lists grow by the freed height, and the restore control brings the fields back

#### Scenario: One list at a time
- **WHEN** the Regions list is open and the user opens Lines
- **THEN** Lines is open and Regions is closed
