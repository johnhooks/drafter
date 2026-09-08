## Purpose

Draws a cut through the run at one position so depths, toe kick recess, counter overhang, and upper cabinet height above the counter can be read.

## ADDED Requirements

### Requirement: Section is taken at one x position
The section SHALL be drawn at a given x position along the wall. It SHALL show the wall as a vertical line on the left, the floor and ceiling, and the outline of every box, counter segment, and toe kick segment whose x range contains that position, viewed from the side with depth increasing to the right. The caller SHALL choose the position; when no item is selected the editor SHALL use the centre of the first base row cabinet, or x = 0 if there is none.

#### Scenario: Section through base and upper
- **WHEN** a section is taken through a 24" deep base with a 12" deep upper above it
- **THEN** the SVG shows the base outline 24" deep, the toe kick recess, the counter slab with its overhang, and the upper outline 12" deep at its bottom height

#### Scenario: Section through empty space
- **WHEN** the section position falls in a space item in both rows
- **THEN** the SVG shows only the wall, floor, and ceiling

### Requirement: Section is dimensioned automatically
The section SHALL dimension: base depth, counter depth including overhang, upper depth, toe kick height and recess, counter top height, gap between counter top and upper bottom, upper height, and ceiling height, omitting any that do not apply at that position.

#### Scenario: Default dimensions
- **WHEN** a section through a default base and default upper is rendered
- **THEN** it shows `24"`, `25 1/2"`, `12"`, `4"`, `3"`, `36"`, `18"`, `30"`, and `96"`
