# extrude Specification

## Purpose
Turns rectangles from a sketch into solid geometry by extruding them along the sketch plane's normal, creating a new body or joining to or cutting an existing one.

## Requirements

### Requirement: Extrude inputs
An extrude feature SHALL reference one sketch and one or more region references per `sketch-regions` in that sketch, a signed distance in sixteenths that is not zero, an operation of new, join, or cut, and for join and cut a target body id. Positive distance SHALL extrude along the sketch plane's normal; negative SHALL extrude against it. A region reference that does not resolve SHALL fail the extrude with its message.

#### Scenario: Missing regions rejected
- **WHEN** an extrude references no regions
- **THEN** validation reports an error

#### Scenario: Zero distance rejected
- **WHEN** an extrude has distance 0
- **THEN** validation reports an error

#### Scenario: Region no longer enclosed
- **WHEN** an extrude references a region whose loop has been opened
- **THEN** the extrude is marked with an error naming the corner lines and the bodies are as if it were absent

### Requirement: New operation creates a body
With operation new, the extrude SHALL create one body containing all its boxes, joined together if they overlap or touch. The body id SHALL be the extrude feature's id and its name SHALL default to the feature name.

#### Scenario: New body
- **WHEN** two adjacent regions are extruded together with operation new
- **THEN** one body exists whose volume is the sum of the two

### Requirement: Join and cut modify the target body
With operation join, each box SHALL be joined to the target body per `solid-model`. With operation cut, each box SHALL be cut from the target body. If the target body does not exist at that point in the timeline, the feature SHALL error.

#### Scenario: Cut a dado
- **WHEN** a 3/4" by 24" rectangle across the top face of a 24x24x24 body is extruded 1/4" into it with operation cut on that body
- **THEN** the body's volume is reduced by 4 1/2 cubic inches and a groove runs across its top face

#### Scenario: Join adds a shelf
- **WHEN** a rectangle on a body's side face is extruded 12 with operation join on that body
- **THEN** the body's bounding box grows by 12 in that direction

### Requirement: Extrude default target
When a sketch is attached to a face of a body, new extrudes from that sketch SHALL default to operation join with that body as target. When a sketch is on a principal plane, new extrudes SHALL default to operation new. When the user changes an extrude's operation to join or cut and it has no target, the target SHALL default to the most recently created body before that extrude, and remain editable.

#### Scenario: Default from face sketch
- **WHEN** an extrude is created from a sketch attached to body B's face
- **THEN** its operation is join and its target is B

#### Scenario: Switching to cut picks a target
- **WHEN** an extrude from a principal-plane sketch with operation new is switched to cut and bodies A then B were created before it
- **THEN** its target is B and the extrude evaluates without error

### Requirement: Each region becomes its boxes
Each referenced region SHALL produce one axis-aligned box per rectangle of its decomposition, spanning the rectangle in the plane and the distance along the normal. Boxes from one extrude SHALL be applied together as a single operation. The extrude result SHALL record, per region, its rectangles, its boxes, and its boundary edges, so faces of the extrusion can be referenced.

#### Scenario: Box from front plane
- **WHEN** a region from (0, 0) to (24, 30) on XZ at offset 0 with normal -Y is extruded 24
- **THEN** the box is x 0 to 24, y -24 to 0, z 0 to 30

#### Scenario: Negative distance
- **WHEN** the same region is extruded -24
- **THEN** the box is x 0 to 24, y 0 to 24, z 0 to 30

#### Scenario: L region
- **WHEN** an L-shaped region is extruded 1
- **THEN** the body's volume is the L's area times 1" and it has one body
