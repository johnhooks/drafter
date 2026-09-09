## MODIFIED Requirements

### Requirement: Handles
Every line SHALL have a handle unique within its sketch, assigned `l1`, `l2`, and so on as one past the highest number in use. Every sketch SHALL have a handle unique within the document, assigned `s1`, `s2`, and so on the same way. Handles SHALL be shown next to names in the line list and the timeline, SHALL NOT change when a feature is renamed, and SHALL be preserved in the document file.

#### Scenario: Handles after deletion
- **WHEN** a sketch has `l1`, `l2`, `l3`, `l2` is deleted, and a line is added
- **THEN** the new line is `l4`

### Requirement: Derived slots are shown, not stored
The derived run slot of each line SHALL be shown in the line properties with its computed value and marked as derived. Editing it SHALL follow the slot rule in `sketch`.

#### Scenario: Derived length shown
- **WHEN** a line's run has min 2 and max 10 driven
- **THEN** the length field shows `8"` and is marked derived

### Requirement: Constraints are listed per sketch
The sketch properties SHALL list every expression-driven slot of every line in the sketch as `<handle>.<slot name> = <expression>` with its current value or error, except endpoint attachments: a run min or max slot whose expression is a bare reference to the position of a perpendicular line. Clicking an entry SHALL select that constraint and highlight it in the sketch view. Each entry SHALL have a remove action that replaces the slot with its current resolved number, the same as deleting its dimension.

#### Scenario: List shows links, not attachments
- **WHEN** a rectangle of four attached lines has `l1.at = face.left + 2`
- **THEN** the sketch properties list `l1.at = face.left + 2` and nothing for the eight endpoint attachments

#### Scenario: Remove from the list
- **WHEN** the user removes `l1.at = face.left + 2` from the list while `face.left` is 0
- **THEN** `l1`'s position is the number 2" and the entry disappears

### Requirement: The link tool labels its edges
While the link tool has a line chosen, the sketch view SHALL label the first line "constrain" and, once chosen, the second line or face edge "anchor", so the direction of the relation is visible before the distance is entered.

#### Scenario: Labels during linking
- **WHEN** the user has clicked `l1` and then the face's left edge
- **THEN** the view shows "constrain" at `l1` and "anchor" at the face's left edge

## ADDED Requirements

### Requirement: Lines resolve within a sketch in slot dependency order
Evaluating a sketch SHALL resolve every line's position and run, evaluating expressions in dependency order between slots regardless of the order lines were drawn. A line's position and its run SHALL be resolved independently, so two lines whose endpoints attach to each other's positions are not a cycle. A slot whose expression references a slot that itself failed SHALL fail with a message naming it.

#### Scenario: Mutual attachment is not a cycle
- **WHEN** `l1` is vertical with run min `l3.at` and `l3` is horizontal with run min `l1.at`, both positions numbers
- **THEN** both lines resolve

#### Scenario: Reference to a later line
- **WHEN** `l1.at` is `l2.at + 1` and `l2` was drawn after `l1`
- **THEN** `l1` resolves using `l2`'s value

#### Scenario: Cycle
- **WHEN** `l1.at` is `l2.at` and `l2.at` is `l1.at + 4`
- **THEN** both lines fail with an error naming the cycle

### Requirement: Constrained lines follow their references
When anything a line's expressions reference changes, the line SHALL take its new resolved values on the next evaluation, and regions and extrudes built from it SHALL change with it.

#### Scenario: Inset follows the face
- **WHEN** `l1.at` is `face.left + 2` and `l2.at` is `face.right - 2` on the top of a 24" wide body, and the body's width becomes 30"
- **THEN** the region between them becomes 26" wide and its extrude changes to match

#### Scenario: Parameter change
- **WHEN** a line's length is `ply` and the parameter `ply` changes from 3/4" to 1/2"
- **THEN** its length becomes 1/2"

### Requirement: Failed lines are visible and block dependents
A line that fails to resolve SHALL be drawn in an error style at its last successfully resolved position if one exists in the current session, or not at all otherwise, SHALL be listed with its error in the sketch's properties and the warnings list, and SHALL NOT bound any region. An extrude whose region depends on it SHALL fail with a message naming the region's corner lines or the missing region.

#### Scenario: Extrude blocked by a failed line
- **WHEN** `l1` fails because `ply` was deleted and Extrude 2 extrudes the region at the corner of `l1` and `l3`
- **THEN** Extrude 2 is marked with an error naming `l1`

## REMOVED Requirements

### Requirement: Rectangles resolve within a sketch in dependency order
**Reason**: Resolution is per line slot; see the added requirement.
**Migration**: None.

### Requirement: Constrained rectangles follow their references
**Reason**: Replaced by the line form of the same rule.
**Migration**: None.

### Requirement: Failed rectangles are visible and block dependents
**Reason**: Replaced by the line form of the same rule.
**Migration**: None.

### Requirement: Document format version 2
**Reason**: File versions are specified in `document-file`; the current version is 4.
**Migration**: Version 1 and 2 files still load through the chain of migrations there.
