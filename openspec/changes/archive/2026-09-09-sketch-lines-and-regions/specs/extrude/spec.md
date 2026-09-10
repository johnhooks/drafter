## MODIFIED Requirements

### Requirement: Extrude inputs
An extrude feature SHALL reference one sketch and one or more region references per `sketch-regions` in that sketch, a signed distance in sixteenths that is not zero, an operation of new, join, or cut, and for join and cut a target body id. Positive distance SHALL extrude along the sketch plane's normal; negative SHALL extrude against it. A region reference that does not resolve SHALL fail the extrude with its message.

#### Scenario: Missing rectangles rejected
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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Each rectangle becomes a box
**Reason**: Extrudes reference regions, which decompose into one or more boxes.
**Migration**: Version 3 extrudes are converted to region references on load per `document-file`.
