## Purpose

Defines the small language used wherever a length can be written as a formula, how names in it resolve, and how failures are reported, so that constraints, parameters, and later cross-sketch references all share one evaluator.

## ADDED Requirements

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
Names SHALL resolve against a scope containing: document parameters by name; rectangles of the same sketch by handle with the properties `left`, `right`, `bottom`, `top`, `width`, `height`, `umid`, `vmid`; and, when the sketch is attached to a face, `face` with the same properties describing the face rectangle in plane coordinates. `face` SHALL be undefined on a principal plane sketch. An unknown name SHALL be an error naming it. The scope SHALL be an explicit input to evaluation so later changes can add entries without changing the grammar.

#### Scenario: Face reference
- **WHEN** a sketch on the top face of a 24" cube at the origin evaluates `face.right - 2`
- **THEN** the result is 22"

#### Scenario: Unknown name
- **WHEN** `r9.left + 1` is evaluated in a sketch with no rectangle `r9`
- **THEN** evaluation fails with an error naming `r9`

#### Scenario: No face on a principal plane
- **WHEN** a sketch on XZ evaluates `face.left`
- **THEN** evaluation fails with an error saying the sketch has no face

### Requirement: Positions carry an axis; lengths do not
Every resolved value SHALL be either a length or a position tagged with the model axis it lies on. `left`, `right`, `umid` SHALL be positions on the plane's u axis; `bottom`, `top`, `vmid` on the v axis; `width`, `height`, parameters, and literals SHALL be lengths. Adding or subtracting a length to a position SHALL give a position on the same axis; subtracting two positions on the same axis SHALL give a length; combining positions on different axes SHALL be an error. A u slot SHALL accept a u position or a length; a v slot likewise; a size slot SHALL accept only a length.

#### Scenario: Position minus position is a length
- **WHEN** a size slot holds `r1.right - r1.left`
- **THEN** it evaluates to `r1`'s width

#### Scenario: Wrong axis
- **WHEN** a u min slot holds `r1.top`
- **THEN** evaluation fails with an error saying `r1.top` is a v position

### Requirement: Expressions display with their value
Wherever an expression is shown, the UI SHALL show the expression text and, when it evaluates, its current value formatted per `dimension-units`; when it fails, the error instead.

#### Scenario: Field shows both
- **WHEN** a slot holds `face.left + 2` and `face.left` is 0
- **THEN** the field shows `face.left + 2` and `2"`
