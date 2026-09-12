## MODIFIED Requirements

### Requirement: Rectangle form
Selecting a member line, selecting exactly the rectangle's four member lines, or selecting a single region that is exactly the rectangle's area, SHALL show the rectangle's form: Left, Right, Bottom, Top, Width, Height, and Explode. Four selected lines that are a rectangle's members SHALL show its form and not the Make rectangle action. Left, Right, Bottom, and Top SHALL show and write the member line's position, accepting a length or an expression. Width SHALL write the right line's position as the left line's position plus the value: as a number when the value is a number, or as `<left handle>.at + (expression)` when it is an expression; Height likewise for the top line. Width and Height SHALL be refused with a message naming the expression when the far line's position is an expression.

#### Scenario: Clicking inside the rectangle shows its form
- **WHEN** the user clicks inside `r1` with the Select tool, or chooses its row in the rectangle list
- **THEN** `r1`'s form is shown

#### Scenario: The form survives a split
- **WHEN** a line splits `r1` across and the user chooses `r1` in the rectangle list
- **THEN** `r1`'s form is shown and typing a Width moves its right line, with the splitting line's ends still on the top and bottom

#### Scenario: Four member lines show the form
- **WHEN** the user selects `r1`'s four lines in the view
- **THEN** `r1`'s form is shown and no Make rectangle action is offered

#### Scenario: Type a width
- **WHEN** `r1` spans u 2 to 26 and the user types `20` for Width
- **THEN** the right line's position is 22" and the left line is unchanged

#### Scenario: Width by expression
- **WHEN** the user types `ply * 2` for Width
- **THEN** the right line's position is `l1.at + (ply * 2)`

#### Scenario: Left moves the edge
- **WHEN** `r1` spans u 2 to 26 and the user types `4` for Left
- **THEN** the left line's position is 4" and the rectangle is 22" wide

#### Scenario: Width refused
- **WHEN** the right line's position is `face.right - 2` and the user types a Width
- **THEN** the edit is refused with a message naming `face.right - 2`
