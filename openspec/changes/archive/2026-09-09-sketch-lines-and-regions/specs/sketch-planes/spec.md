## MODIFIED Requirements

### Requirement: Planes attached to a face
A sketch plane SHALL be definable by reference to a face of a body: the id of the extrude feature, a region reference per `sketch-regions` into its sketch, and which face of that region's extrusion: the cap, the base, or a side named by the id of the bounding line that produced it and its outward direction. Resolving the reference SHALL yield a principal plane, offset, and normal equal to that face's outward direction, computed from the referenced feature's current result, and the face's bounding rectangle in plane coordinates for use as `face` in expressions.

#### Scenario: Sketch on cap of an extrusion
- **WHEN** a 24" extrusion from XZ at offset 0 with normal -Y is referenced by its cap face
- **THEN** the plane resolves to XZ at offset -24" with normal -Y

#### Scenario: Reference follows edits
- **WHEN** that extrusion's distance changes to 30"
- **THEN** the plane resolves to XZ at offset -30"

#### Scenario: Side face by line
- **WHEN** a region bounded on the right by vertical line `l2` at u 24 on XZ is extruded 24 and referenced by the side `l2` outward +u
- **THEN** the plane resolves to YZ at offset 24" with normal +X and the face rectangle spans the extrusion depth and the line's bounding span

### Requirement: Unresolvable face references are errors
If the referenced feature no longer exists, its region reference does not resolve, the named bounding line no longer bounds the region on that side, or the referenced face has been entirely removed by later cuts, resolving SHALL fail with an error naming the feature and face. It SHALL NOT silently fall back to another plane.

#### Scenario: Referenced feature deleted
- **WHEN** the extrude that a sketch plane references is deleted
- **THEN** resolving the plane fails with an error naming that extrude

#### Scenario: Bounding line no longer on the boundary
- **WHEN** a side face reference names `l2` and `l2` is moved so it no longer bounds the region
- **THEN** resolving the plane fails with an error naming `l2`
