# solid-model Specification

## Purpose
Represents solid bodies exactly as unions of axis-aligned boxes so that joins and cuts have exact results and every face is a rectangle on an axis-aligned plane.

## Requirements

### Requirement: A body is a set of disjoint axis-aligned boxes
A body SHALL be represented as a set of axis-aligned boxes in model coordinates with all bounds in sixteenths. No two boxes in a body SHALL overlap in volume. A body SHALL have a stable id and a display name. A body whose box set becomes empty SHALL be removed.

#### Scenario: Body from one box
- **WHEN** a body is created from the box x 0 to 24, y 0 to 12, z 0 to 30
- **THEN** the body contains exactly that one box and its bounding box is the same

### Requirement: Join adds a box to a body
Joining a box to a body SHALL produce a body whose volume is the union of the two. The result SHALL remain a set of disjoint boxes. Joining a box entirely inside the body SHALL leave the volume unchanged.

#### Scenario: Join overlapping box
- **WHEN** a 24x24x24 box at the origin is joined with a 24x24x24 box offset 12 in x
- **THEN** the body's volume is 24 * 24 * 36 and no two of its boxes overlap

#### Scenario: Join contained box
- **WHEN** a 4x4x4 box inside a 24x24x24 body is joined
- **THEN** the body's volume is unchanged

### Requirement: Cut removes a box from a body
Cutting a box from a body SHALL produce a body whose volume is the body minus the box. A cut that removes everything SHALL leave the body empty. A cut that does not touch the body SHALL leave it unchanged.

#### Scenario: Cut a through hole
- **WHEN** a 4x4 box spanning the full y depth is cut from a 24x24x24 body
- **THEN** the body's volume is 24 * 24 * 24 - 4 * 24 * 4 and the body has a rectangular hole through it in y

#### Scenario: Cut a pocket
- **WHEN** a 4x4x2 box is cut into the top face of a 24x24x24 body
- **THEN** the body's volume is reduced by 32 and the body's bounding box is unchanged

### Requirement: Volume and bounds are queryable
The system SHALL report a body's volume and bounding box exactly.

#### Scenario: Volume after operations
- **WHEN** a body has been joined and cut several times
- **THEN** its reported volume equals the sum of its box volumes

### Requirement: Exposed faces are derived from the body
The system SHALL compute a body's exposed faces: for each axis-aligned plane and outward direction, the set of rectangles on the body's surface facing that direction. Faces on the same plane with the same direction that share an edge SHALL be reported as one face with a rectilinear outline. Internal box boundaries SHALL NOT appear as faces.

#### Scenario: Six faces of one box
- **WHEN** faces are computed for a single-box body
- **THEN** exactly six faces are reported, one per direction

#### Scenario: Merged top face after join
- **WHEN** two boxes of equal height are joined side by side
- **THEN** the +Z direction reports one top face covering both, not two

#### Scenario: Pocket creates faces
- **WHEN** a pocket is cut into the top of a box
- **THEN** the +Z faces are the top outline with the pocket subtracted plus the pocket floor, and four new side faces line the pocket
