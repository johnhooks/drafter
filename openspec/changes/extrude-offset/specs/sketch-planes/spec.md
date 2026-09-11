## MODIFIED Requirements

### Requirement: Planes attached to a face
A sketch plane SHALL be definable by reference to a face of a body: the id of the extrude feature, a region reference per `sketch-regions` into its sketch, and which face of that region's extrusion: the cap, the base, or a side named by the id of the bounding line that produced it and its outward direction. Resolving the reference SHALL yield a principal plane, offset, and normal equal to that face's outward direction, computed from the referenced feature's current result, and the face's bounding rectangle in plane coordinates for use as `face` in expressions. When the referenced extrude has an offset, the base SHALL be the plane the extrusion starts on, the cap the plane it ends on, and a side SHALL span between them, not from the sketch plane.

#### Scenario: Sketch on cap of an extrusion
- **WHEN** a 24" extrusion from XZ at offset 0 with normal -Y is referenced by its cap face
- **THEN** the plane resolves to XZ at offset -24" with normal -Y

#### Scenario: Reference follows edits
- **WHEN** that extrusion's distance changes to 30"
- **THEN** the plane resolves to XZ at offset -30"

#### Scenario: Base of an offset extrusion
- **WHEN** that extrusion is given an offset of 6" and is referenced by its base face
- **THEN** the plane resolves to XZ at offset -6" with normal +Y, and its cap resolves to XZ at offset -36"

#### Scenario: Side face by line
- **WHEN** a region bounded on the right by vertical line `l2` at u 24 on XZ is extruded 24 and referenced by the side `l2` outward +u
- **THEN** the plane resolves to YZ at offset 24" with normal +X and the face rectangle spans the extrusion depth and the line's bounding span

#### Scenario: Side face of an offset extrusion
- **WHEN** that extrusion is given an offset of 6" and the same side is referenced
- **THEN** the face rectangle spans the extrusion depth starting 6" from the sketch plane
