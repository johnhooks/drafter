## Purpose

Turns rectangles from a sketch into solid geometry by extruding them along the sketch plane's normal, creating a new body or joining to or cutting an existing one.

## ADDED Requirements

### Requirement: Extrude inputs
An extrude feature SHALL reference one sketch and one or more rectangle ids in that sketch, a signed distance in sixteenths that is not zero, an operation of new, join, or cut, and for join and cut a target body id. Positive distance SHALL extrude along the sketch plane's normal; negative SHALL extrude against it.

#### Scenario: Missing rectangles rejected
- **WHEN** an extrude references no rectangles
- **THEN** validation reports an error

#### Scenario: Zero distance rejected
- **WHEN** an extrude has distance 0
- **THEN** validation reports an error

### Requirement: Each rectangle becomes a box
Each referenced rectangle SHALL produce an axis-aligned box spanning the rectangle in the plane and the distance along the normal. Boxes from one extrude SHALL be applied together as a single operation.

#### Scenario: Box from front plane
- **WHEN** a rectangle from (0, 0) to (24, 30) on XZ at offset 0 with normal -Y is extruded 24
- **THEN** the box is x 0 to 24, y -24 to 0, z 0 to 30

#### Scenario: Negative distance
- **WHEN** the same rectangle is extruded -24
- **THEN** the box is x 0 to 24, y 0 to 24, z 0 to 30

### Requirement: New operation creates a body
With operation new, the extrude SHALL create one body containing all its boxes, joined together if they overlap. The body id SHALL be the extrude feature's id and its name SHALL default to the feature name.

#### Scenario: New body
- **WHEN** two overlapping rectangles are extruded with operation new
- **THEN** one body exists whose volume is the union of the two boxes

### Requirement: Join and cut modify the target body
With operation join, each box SHALL be joined to the target body per `solid-model`. With operation cut, each box SHALL be cut from the target body. If the target body does not exist at that point in the timeline, the feature SHALL error.

#### Scenario: Cut a dado
- **WHEN** a 3/4" by 24" rectangle across the top face of a 24x24x24 body is extruded 1/4" into it with operation cut on that body
- **THEN** the body's volume is reduced by 4 1/2 cubic inches and a groove runs across its top face

#### Scenario: Join adds a shelf
- **WHEN** a rectangle on a body's side face is extruded 12 with operation join on that body
- **THEN** the body's bounding box grows by 12 in that direction

### Requirement: Extrude default target
When a sketch is attached to a face of a body, new extrudes from that sketch SHALL default to operation join with that body as target. When a sketch is on a principal plane, new extrudes SHALL default to operation new.

#### Scenario: Default from face sketch
- **WHEN** an extrude is created from a sketch attached to body B's face
- **THEN** its operation is join and its target is B
