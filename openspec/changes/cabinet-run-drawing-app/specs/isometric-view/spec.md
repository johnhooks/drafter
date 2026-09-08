## Purpose

Gives an at-a-glance three-dimensional picture of the whole run so the builder can see how uppers, bases, talls, and appliances relate.

## ADDED Requirements

### Requirement: Isometric projection of every box
The isometric view SHALL render every box, counter segment, and toe kick segment as an SVG using a fixed isometric projection viewed from the front, left, and above. Each box SHALL draw its top, front, and left faces. The wall and floor SHALL be drawn as a backdrop. No dimensions SHALL be drawn.

#### Scenario: Single box faces
- **WHEN** a run with one base cabinet is rendered
- **THEN** the SVG contains three filled faces for the cabinet, plus faces for its toe kick and counter

### Requirement: Nearer boxes hide farther boxes
Boxes SHALL be drawn so that a box nearer to the viewer covers a farther box where they overlap on screen. Filled faces SHALL be opaque.

#### Scenario: Base in front of upper
- **WHEN** a base cabinet sits under an upper cabinet
- **THEN** the base's top face is visible and no part of the upper draws over the base's front face

### Requirement: Fronts appear on front faces
Doors and drawers SHALL be drawn on the projected front face of each cabinet using the same layout as the elevation. Appliance labels SHALL be drawn on the appliance's front face.

#### Scenario: Drawer visible in isometric
- **WHEN** a base with a drawer over a door is rendered
- **THEN** the front face shows a drawer outline above a door outline
