## Purpose

Makes rectangles parametric: each axis is defined by two driven values that may be expressions, so a rectangle can follow the face it sits on, another rectangle, or a named parameter.

## ADDED Requirements

### Requirement: Handles
Every rectangle SHALL have a handle unique within its sketch, assigned `r1`, `r2`, and so on as one past the highest number in use. Every sketch SHALL have a handle unique within the document, assigned `s1`, `s2`, and so on the same way. Handles SHALL be shown next to names in the rectangle list and the timeline, SHALL NOT change when a feature is renamed, and SHALL be preserved in the document file.

#### Scenario: Handles after deletion
- **WHEN** a sketch has `r1`, `r2`, `r3`, `r2` is deleted, and a rectangle is added
- **THEN** the new rectangle is `r4`

### Requirement: Rectangles resolve within a sketch in dependency order
Evaluating a sketch SHALL resolve every rectangle's slots, evaluating expressions in dependency order regardless of the order rectangles were drawn. A rectangle whose expression references a rectangle that itself failed SHALL fail with a message naming it.

#### Scenario: Reference to a later rectangle
- **WHEN** `r1.left` is `r2.right + 1` and `r2` was drawn after `r1`
- **THEN** `r1` resolves using `r2`'s value

#### Scenario: Cycle
- **WHEN** `r1.left` is `r2.right` and `r2.right` is `r1.left + 4`
- **THEN** both rectangles fail with an error naming the cycle

### Requirement: Constrained rectangles follow their references
When anything a rectangle's expressions reference changes, the rectangle SHALL take its new resolved values on the next evaluation, and extrudes built from it SHALL change with it.

#### Scenario: Inset follows the face
- **WHEN** `r1` has u min `face.left + 2` and u max `face.right - 2` on the top of a 24" wide body, and the body's width becomes 30"
- **THEN** `r1`'s width becomes 26" and its extrude changes to match

#### Scenario: Parameter change
- **WHEN** `r1`'s size is `ply` and the parameter `ply` changes from 3/4" to 1/2"
- **THEN** `r1`'s size becomes 1/2"

### Requirement: Derived slots are shown, not stored
The derived slot on each axis SHALL be shown in the rectangle properties with its computed value and marked as derived. Editing it SHALL follow the slot-edit rule in `sketch`.

#### Scenario: Derived width shown
- **WHEN** a rectangle has u min 2 and u max 10 driven
- **THEN** the width field shows `8"` and is marked derived

### Requirement: Failed rectangles are visible and block dependents
A rectangle that fails to resolve SHALL be drawn in an error style at its last successfully resolved position if one exists in the current session, or not at all otherwise, SHALL be listed with its error in the sketch's properties and the warnings list, and SHALL cause any extrude referencing it to fail with a message naming the rectangle.

#### Scenario: Extrude blocked by a failed rectangle
- **WHEN** `r1` fails because `ply` was deleted and Extrude 2 extrudes `r1`
- **THEN** Extrude 2 is marked with an error naming `r1`

### Requirement: Document format version 2
The document SHALL be saved as version 2 with rectangles stored per axis as their two driven slots and a handle, and with parameters. Loading a version 1 document SHALL convert each rectangle's corners to driven min and max, assign handles in order, add an empty parameter list, and report no errors. Loading SHALL accept only versions 1 and 2.

#### Scenario: Version 1 file loads
- **WHEN** a version 1 document with a rectangle at corners (0, 0) and (24, 24) is opened
- **THEN** it loads as version 2 with that rectangle as `r1` with u min 0, u max 384, v min 0, v max 384
