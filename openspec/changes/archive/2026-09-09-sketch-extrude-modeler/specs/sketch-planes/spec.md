## Purpose

Defines where a sketch lives: one of the three principal planes at an offset, or a face of an existing body, and how sketch coordinates map to model coordinates.

## ADDED Requirements

### Requirement: Model axes with Z up
The model coordinate system SHALL be right-handed with Z up. The front view SHALL look along +Y from the -Y side, so +X is to the right, +Y is depth away from the viewer, and +Z is height.

#### Scenario: Front view orientation
- **WHEN** the front (XZ) plane is viewed from its default side
- **THEN** +X is to the right and +Z is up

### Requirement: Principal planes at an offset
A sketch plane SHALL be definable as one of XZ, XY, or YZ plus an offset in sixteenths along that plane's normal axis (Y, Z, or X respectively) and a side, positive or negative, that says which way the plane's normal points. The default plane SHALL be XZ at offset 0 with normal -Y (facing the front viewer).

#### Scenario: Default plane
- **WHEN** a new sketch is created with no plane chosen
- **THEN** it is on XZ at offset 0 with normal -Y

#### Scenario: Offset top plane
- **WHEN** a sketch plane is XY at offset 36" with normal +Z
- **THEN** a point (u, v) on it maps to model (x = u, y = v, z = 36")

### Requirement: Plane coordinate mapping
Each plane SHALL define a (u, v) system: XZ has u = x, v = z; XY has u = x, v = y; YZ has u = y, v = z. Mapping SHALL be exact in sixteenths in both directions. The normal SHALL be the remaining axis with the plane's sign.

#### Scenario: YZ mapping
- **WHEN** a point (u = 10", v = 20") is on YZ at offset 5" with normal +X
- **THEN** it maps to model (x = 5", y = 10", z = 20")

### Requirement: Planes attached to a face
A sketch plane SHALL be definable by reference to a face of a body: the id of the extrude feature that created the box, and which of that box's six faces (the extrude cap, its base, or its four sides named by plane coordinate: uMin, uMax, vMin, vMax). Resolving the reference SHALL yield a principal plane, offset, and normal equal to that face's outward direction, computed from the referenced feature's current result.

#### Scenario: Sketch on cap of an extrusion
- **WHEN** a 24" extrusion from XZ at offset 0 with normal -Y is referenced by its cap face
- **THEN** the plane resolves to XZ at offset -24" with normal -Y

#### Scenario: Reference follows edits
- **WHEN** that extrusion's distance changes to 30"
- **THEN** the plane resolves to XZ at offset -30"

### Requirement: Unresolvable face references are errors
If the referenced feature no longer exists, produced no box, or the referenced face has been entirely removed by later cuts, resolving SHALL fail with an error naming the feature and face. It SHALL NOT silently fall back to another plane.

#### Scenario: Referenced feature deleted
- **WHEN** the extrude that a sketch plane references is deleted
- **THEN** resolving the plane fails with an error naming that extrude
