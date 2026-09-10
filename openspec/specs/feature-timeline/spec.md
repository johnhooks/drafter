# feature-timeline Specification

## Purpose
Keeps the model parametric: an ordered list of sketch and extrude features that is re-evaluated whenever anything changes, so editing an early dimension updates everything built on it.

## Requirements

### Requirement: The document is an ordered feature list
A document SHALL consist of a title and an ordered list of features. Each feature SHALL be a sketch or an extrude with a unique id and an auto-generated name (Sketch 1, Extrude 1, and so on) that the user may rename. New features SHALL be appended at the end.

#### Scenario: Auto naming
- **WHEN** two sketches and one extrude have been added
- **THEN** their names are Sketch 1, Sketch 2, Extrude 1

### Requirement: Evaluation runs features in order
Evaluating a document SHALL process features from first to last, resolving each sketch's plane and reference geometry from the model state at that point and applying each extrude to produce or modify bodies. The result SHALL be the set of bodies after the last feature, plus per-feature results and errors.

#### Scenario: Sequential dependency
- **WHEN** Extrude 1 creates a body, Sketch 2 is on its top face, and Extrude 2 cuts a pocket from Sketch 2
- **THEN** evaluation yields one body with a pocket in its top

### Requirement: Any edit re-evaluates the document
Changing any feature parameter (a rectangle corner, an extrude distance or operation, a plane offset) SHALL re-evaluate the whole document and update every dependent result.

#### Scenario: Upstream edit propagates
- **WHEN** Extrude 1's distance changes from 24 to 30 and Sketch 2 is on its cap face
- **THEN** Sketch 2's plane and Extrude 2's geometry move with the cap

### Requirement: Errors are isolated and reported
A feature that fails to evaluate (unresolvable plane, missing target body, missing rectangle, validation error) SHALL be marked with an error message and skipped. Features that depend on a skipped feature SHALL also be marked as errored with a message naming the failed dependency. Independent features SHALL still evaluate. The UI SHALL list every errored feature.

#### Scenario: Missing target body
- **WHEN** an extrude with operation cut targets a body that does not exist yet
- **THEN** that extrude is marked with an error, the bodies are as if it were absent, and unrelated features evaluate normally

### Requirement: Deleting a feature deletes its dependents
Deleting a feature SHALL also delete every feature that references it, directly or transitively: extrudes that use a sketch, sketches whose plane references an extrude, and extrudes whose target body was created by a deleted extrude. The system SHALL list what will be removed and require confirmation before removing.

#### Scenario: Delete an extrude with a face sketch on it
- **WHEN** Extrude 1 is deleted and Sketch 2 is attached to its face and Extrude 2 uses Sketch 2
- **THEN** the confirmation lists Extrude 1, Sketch 2, and Extrude 2, and all three are removed on confirm
