# sketch-rectangles Specification

## Purpose
Defines a rectangle as a named group of four attached lines that can be edited as a whole, referenced by name, and dropped back to its lines.

## Requirements

### Requirement: A rectangle groups four lines
A sketch MAY hold rectangles. A rectangle SHALL have an id, a handle unique within the sketch assigned `r1`, `r2`, and so on as one past the highest number in use, and four member lines in the order left, bottom, right, top, where left and right are vertical and bottom and top are horizontal. The member lines SHALL remain ordinary lines. A line SHALL belong to at most one rectangle. Drawing with the Rectangle tool SHALL create a rectangle with its four attached lines.

#### Scenario: Rectangle tool makes a record
- **WHEN** the user drags a rectangle from (2, 4) to (10, 20) in an empty sketch
- **THEN** the sketch has lines `l1` to `l4` and a rectangle `r1` whose members are `l1`, `l2`, `l3`, `l4`

#### Scenario: Handles after deletion
- **WHEN** a sketch has `r1` and `r2`, `r1` is exploded, and a rectangle is drawn
- **THEN** the new rectangle is `r3`

### Requirement: Explode and group
Exploding a rectangle SHALL remove its record and leave its lines and their attachments unchanged, after rewriting every expression in the sketch that named the rectangle to the equivalent over its member lines, so nothing that referenced it breaks. Grouping SHALL turn four selected lines into a rectangle when they are two vertical and two horizontal lines and each run end of each is attached to the perpendicular one of the four it meets, or to a line collinear with it; otherwise it SHALL be refused with a message saying what is missing.

#### Scenario: Explode keeps the shape
- **WHEN** `r1` is exploded
- **THEN** its four lines still enclose the same region and no rectangle named `r1` exists

#### Scenario: Explode keeps references working
- **WHEN** `l5.at` is `r1.right + 1` and `r1` is exploded
- **THEN** `l5.at` is `l3.at + 1` and still resolves

#### Scenario: Group four attached lines
- **WHEN** the user selects four lines drawn with the Line tool that close a rectangle and chooses Make rectangle
- **THEN** a rectangle is created with those lines as left, bottom, right, top by position

#### Scenario: Group refused
- **WHEN** the user selects three lines and chooses Make rectangle
- **THEN** the action is refused with a message saying four lines are needed

### Requirement: Deleting a member dissolves the rectangle
Deleting a member line SHALL rewrite references to the rectangle as exploding does, remove the record, and leave the other three as loose lines, with the deletion rule for lines in `sketch` applied to their attached ends.

#### Scenario: One side deleted
- **WHEN** `r1`'s right line is deleted
- **THEN** no rectangle `r1` exists and its left, bottom, and top lines remain

### Requirement: Rectangle form
Selecting a member line, or selecting a single region that is exactly the rectangle's area, SHALL show the rectangle's form: Left, Right, Bottom, Top, Width, Height, and Explode. Left, Right, Bottom, and Top SHALL show and write the member line's position, accepting a length or an expression. Width SHALL write the right line's position as the left line's position plus the value: as a number when the value is a number, or as `<left handle>.at + (expression)` when it is an expression; Height likewise for the top line. Width and Height SHALL be refused with a message naming the expression when the far line's position is an expression.

#### Scenario: Clicking inside the rectangle shows its form
- **WHEN** the user clicks inside `r1` with the Select tool, or chooses its row in the shape list
- **THEN** `r1`'s form is shown

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
