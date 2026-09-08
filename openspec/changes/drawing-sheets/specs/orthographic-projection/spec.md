## Purpose

Turns solid bodies into exact 2D line drawings for front, top, and side views, with hidden edges distinguished from visible ones so the drawings read like conventional drafting.

## ADDED Requirements

### Requirement: Four principal view directions
The system SHALL project a set of bodies along one of four view directions with Z up: front looking along +Y, top looking along -Z, right looking along -X, left looking along +X. View axes SHALL be: front u = x, v = z; top u = x, v = y; right u = y, v = z; left u = -y, v = z. All coordinates SHALL be exact sixteenths.

#### Scenario: Front projection of a box
- **WHEN** a box x 0 to 24, y -12 to 0, z 0 to 30 is projected front
- **THEN** its outline is the rectangle u 0 to 24, v 0 to 30

#### Scenario: Left view mirrors right
- **WHEN** the same box is projected left and right
- **THEN** both outlines span v 0 to 30, right spans u -12 to 0 and left spans u 0 to 12

### Requirement: Edges are classified visible or hidden
The projection SHALL output axis-aligned edge segments in view coordinates, each marked visible or hidden. An edge is hidden where a face of any body lies between it and the viewer. Segments SHALL be split where their visibility changes. Segments that coincide after projection SHALL be merged, with visible taking precedence over hidden.

#### Scenario: Pocket hidden in front view
- **WHEN** a body with a pocket in its top face is projected front
- **THEN** the pocket's floor and walls appear as hidden segments inside the outline and the outline is visible

#### Scenario: Through hole in front view
- **WHEN** a body with a square hole through it in y is projected front
- **THEN** the hole's outline appears as visible segments

#### Scenario: Box behind box
- **WHEN** a small box sits fully behind a larger box in the front view
- **THEN** the small box's edges are all hidden

### Requirement: Silhouette of coplanar neighbours
Edges between two faces on the same plane with the same direction SHALL NOT be output, so merged faces draw as one outline.

#### Scenario: Joined boxes draw one outline
- **WHEN** two boxes of equal height joined side by side are projected front
- **THEN** there is no vertical segment at the join

### Requirement: Snap targets from a projection
The projection SHALL also output its vertices (segment endpoints) and its segments as snap targets in view coordinates, whether visible or hidden.

#### Scenario: Hidden corners are snappable
- **WHEN** a pocket is hidden in the front view
- **THEN** the pocket's corners are still in the vertex list
