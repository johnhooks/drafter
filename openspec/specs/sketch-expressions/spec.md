# sketch-expressions Specification

## Purpose
Defines the small language used wherever a length can be written as a formula, how names in it resolve, and how failures are reported, so that constraints, parameters, and later cross-sketch references all share one evaluator.

## Requirements

### Requirement: Expression grammar
An expression SHALL consist of length literals, names, the operators `+`, `-`, `*`, `/`, unary minus, and parentheses, with the usual precedence. A literal SHALL accept every form `dimension-units` accepts for input: whole inches, a bare fraction, a mixed number written with a space or hyphen (`2 1/4`, `2-1/4`), a decimal, and an optional trailing `"`. Whitespace SHALL be ignored outside a mixed number. Names SHALL be identifiers (`ply`) or dotted paths (`r1.right`, `face.width`).

#### Scenario: Mixed number and arithmetic
- **WHEN** the expression `face.left + 2 1/4` is evaluated with `face.left` = 0
- **THEN** the result is 36 sixteenths

#### Scenario: Precedence and parentheses
- **WHEN** `(r1.width - 3/4) / 2` is evaluated with `r1.width` = 24"
- **THEN** the result is 11 5/8"

### Requirement: Results are whole sixteenths
The result of an expression SHALL be rounded to the nearest sixteenth. Division by zero SHALL be an error.

#### Scenario: Rounding
- **WHEN** `r1.width / 3` is evaluated with `r1.width` = 1"
- **THEN** the result is 5 sixteenths

#### Scenario: Division by zero
- **WHEN** `ply / 0` is evaluated
- **THEN** evaluation fails with an error naming the expression

### Requirement: Name resolution scope
Names SHALL resolve against a scope containing: document parameters by name; lines of the same sketch by handle with the properties `at`, `mid`, `length`, and for a horizontal line `left` and `right`, for a vertical line `bottom` and `top`; and, when the sketch is attached to a face, `face` with the properties `left`, `right`, `bottom`, `top`, `width`, `height`, `umid`, `vmid` describing the face's bounding rectangle in plane coordinates. `face` SHALL be undefined on a principal plane sketch. An unknown name or a property a line's direction does not have SHALL be an error naming it and listing the valid properties. The scope SHALL be an explicit input to evaluation so later changes can add entries without changing the grammar.

#### Scenario: Line position
- **WHEN** `l1` is a vertical line at u 10 and `l1.at + 2` is evaluated
- **THEN** the result is a u position at 12"

#### Scenario: Wrong direction property
- **WHEN** `l1` is vertical and `l1.left` is evaluated
- **THEN** evaluation fails with an error saying a vertical line has `bottom`, `top`, `mid`, `length`, `at`

#### Scenario: Face reference
- **WHEN** a sketch on the top face of a 24" cube at the origin evaluates `face.right - 2`
- **THEN** the result is 22"

#### Scenario: Unknown name
- **WHEN** `l9.at + 1` is evaluated in a sketch with no line `l9`
- **THEN** evaluation fails with an error naming `l9`

#### Scenario: No face on a principal plane
- **WHEN** a sketch on XZ evaluates `face.left`
- **THEN** evaluation fails with an error saying the sketch has no face

### Requirement: Positions carry an axis; lengths do not
Every resolved value SHALL be either a length or a position tagged with the model axis it lies on. A horizontal line's `at` SHALL be a position on the plane's v axis and its `left`, `right`, `mid` positions on the u axis; a vertical line's `at` SHALL be on the u axis and its `bottom`, `top`, `mid` on the v axis; `length`, `width`, `height`, parameters, and literals SHALL be lengths. Adding or subtracting a length to a position SHALL give a position on the same axis; subtracting two positions on the same axis SHALL give a length; combining positions on different axes SHALL be an error. A position slot and a run min or max slot SHALL accept a position on their axis or a length; a size slot SHALL accept only a length.

#### Scenario: Position minus position is a length
- **WHEN** a size slot holds `l2.at - l1.at` with both lines vertical
- **THEN** it evaluates to the distance between them

#### Scenario: Wrong axis
- **WHEN** a vertical line's position slot holds `l3.at` and `l3` is horizontal
- **THEN** evaluation fails with an error saying `l3.at` is a v position

### Requirement: Expressions display with their value
Wherever an expression is shown, the UI SHALL show the expression text and, when it evaluates, its current value formatted per `dimension-units`; when it fails, the error instead.

#### Scenario: Field shows both
- **WHEN** a slot holds `face.left + 2` and `face.left` is 0
- **THEN** the field shows `face.left + 2` and `2"`
