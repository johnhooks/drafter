## Purpose

Defines what a sketch contains: rectangles on one plane in plane coordinates, plus the reference geometry shown alongside them, so the editor, extrude, and file format agree.

## ADDED Requirements

### Requirement: A sketch belongs to one plane
A sketch SHALL have an id, a name, a plane definition per `sketch-planes`, and an ordered list of rectangles. The plane SHALL NOT change after creation.

#### Scenario: New sketch
- **WHEN** a sketch is created on XY at offset 0
- **THEN** it has no rectangles and its plane is XY at offset 0

### Requirement: Rectangles in plane coordinates
A rectangle SHALL have an id and two opposite corners (u1, v1) and (u2, v2) in sixteenths. Its width SHALL be |u2 - u1| and height |v2 - v1|, both greater than zero. Corner order SHALL NOT matter. Rectangles MAY overlap each other.

#### Scenario: Corners in any order
- **WHEN** a rectangle has corners (10, 20) and (2, 4)
- **THEN** its width is 8, its height is 16, and its lower-left corner is (2, 4)

#### Scenario: Zero-size rectangle rejected
- **WHEN** a rectangle is set with u1 = u2
- **THEN** validation reports an error for that rectangle

### Requirement: Rectangle edits by size or position
A rectangle SHALL be editable by setting its width or height, which moves the corner farther from the origin and keeps the other; by setting its lower-left corner, which moves the whole rectangle; or by setting either corner directly.

#### Scenario: Set width keeps origin corner
- **WHEN** a rectangle with lower-left (4, 4) and width 10 has its width set to 12
- **THEN** its lower-left is still (4, 4) and its far corner u is 16

### Requirement: Reference geometry for a sketch
Given the model state at the time the sketch is evaluated, the system SHALL compute reference geometry in plane coordinates: the exposed faces of all bodies lying on the sketch plane with the same normal (coplanar faces), and the outline of every body projected onto the plane. Reference geometry SHALL be derived, never stored in the sketch.

#### Scenario: Face sketch shows its face
- **WHEN** a sketch is attached to the top face of a 24x24x24 box
- **THEN** its coplanar faces contain one 24 by 24 rectangle at the face's position

#### Scenario: Base plane sketch shows outlines
- **WHEN** a sketch is on XZ at offset 0 and one 24x24x24 box exists at the origin
- **THEN** the projected outlines contain a 24 by 24 outline and the coplanar faces contain the box's -Y face
