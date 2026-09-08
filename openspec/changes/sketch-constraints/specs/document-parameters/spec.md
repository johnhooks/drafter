## Purpose

Lets the user name a length once, such as plywood thickness, and use it everywhere a length can be an expression.

## ADDED Requirements

### Requirement: Parameters are named lengths on the document
A document SHALL hold an ordered list of parameters, each with a unique name that is a valid identifier and a value that is a length or an expression referencing earlier parameters only. Parameters SHALL be edited in the document properties: add, rename, change value, delete.

#### Scenario: Add a parameter
- **WHEN** the user adds `ply` with value `3/4`
- **THEN** `ply` evaluates to 12 sixteenths and is available in every sketch

#### Scenario: Parameter from parameter
- **WHEN** `ply` is `3/4` and `dado` is `ply / 2`
- **THEN** `dado` evaluates to 3/8"

#### Scenario: Invalid name
- **WHEN** the user names a parameter `3ply` or `face`
- **THEN** the change is refused with a message

### Requirement: Renaming updates references
Renaming a parameter SHALL rewrite every expression in the document that references it.

#### Scenario: Rename
- **WHEN** `ply` is renamed to `stock` and `r1.size` is `ply * 2`
- **THEN** `r1.size` becomes `stock * 2` and still evaluates to the same value

### Requirement: Deleting a referenced parameter is refused
Deleting a parameter that any expression references SHALL be refused with a message listing where it is used.

#### Scenario: Delete in use
- **WHEN** the user deletes `ply` while `r1` uses it
- **THEN** the deletion is refused and the message names `r1` in its sketch

### Requirement: Parameters in extrude distance and plane offset
An extrude distance and a principal plane offset SHALL accept an expression that references parameters and literals only. Their fields SHALL display the expression and its value per `sketch-expressions`.

#### Scenario: Extrude by parameter
- **WHEN** an extrude's distance is `ply` and `ply` changes from 3/4" to 1/2"
- **THEN** the extruded box becomes 1/2" thick
