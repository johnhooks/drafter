## MODIFIED Requirements

### Requirement: Extrude inputs
An extrude feature SHALL reference one sketch and one or more region references per `sketch-regions` in that sketch, a signed distance in sixteenths that is not zero, an optional signed offset in sixteenths that defaults to zero when absent, an operation of new, join, or cut, and for join and cut a target body id. Distance and offset MAY each be an expression over parameters. Positive distance SHALL extrude along the sketch plane's normal; negative SHALL extrude against it. The offset SHALL be measured from the sketch plane along its normal, positive along the normal and negative against it, independently of the sign of the distance. The extrusion SHALL start on the plane at the offset and run its distance from there. A region reference that does not resolve SHALL fail the extrude with its message. An offset that does not resolve SHALL fail the extrude with a message naming the offset.

#### Scenario: Missing regions rejected
- **WHEN** an extrude references no regions
- **THEN** validation reports an error

#### Scenario: Zero distance rejected
- **WHEN** an extrude has distance 0
- **THEN** validation reports an error

#### Scenario: Zero offset accepted
- **WHEN** an extrude has offset 0 or no offset
- **THEN** validation accepts it and the extrusion starts on the sketch plane

#### Scenario: Offset expression fails
- **WHEN** an extrude's offset is `depth / 2` and no parameter `depth` exists
- **THEN** the extrude is marked with an error naming the offset and the bodies are as if it were absent

#### Scenario: Region no longer enclosed
- **WHEN** an extrude references a region whose loop has been opened
- **THEN** the extrude is marked with an error naming the corner lines and the bodies are as if it were absent

### Requirement: Each region becomes its boxes
Each referenced region SHALL produce one axis-aligned box per rectangle of its decomposition, spanning the rectangle in the plane and, along the normal, from the sketch plane's offset plus the extrude's offset to that start plus the distance. Boxes from one extrude SHALL be applied together as a single operation. The extrude result SHALL record, per region, its rectangles, its boxes, and its boundary edges, and the plane the extrusion starts on, so faces of the extrusion can be referenced.

#### Scenario: Box from front plane
- **WHEN** a region from (0, 0) to (24, 30) on XZ at offset 0 with normal -Y is extruded 24
- **THEN** the box is x 0 to 24, y -24 to 0, z 0 to 30

#### Scenario: Negative distance
- **WHEN** the same region is extruded -24
- **THEN** the box is x 0 to 24, y 0 to 24, z 0 to 30

#### Scenario: Offset start
- **WHEN** the same region is extruded 24 with offset 8
- **THEN** the box is x 0 to 24, y -32 to -8, z 0 to 30

#### Scenario: Offset against, distance against
- **WHEN** a 4" by 4" region on the top face of a 24" cube (normal +Z at z 24") is extruded -4" with offset -8" and operation cut
- **THEN** the cube loses a 4" by 4" by 4" pocket from z 12" to z 16" and its top face is intact

#### Scenario: L region
- **WHEN** an L-shaped region is extruded 1
- **THEN** the body's volume is the L's area times 1" and it has one body
