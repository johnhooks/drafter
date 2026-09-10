## Purpose

Lets the user draw and adjust rectangles on a sketch plane with the mouse and keyboard, snapped to a sixteenth of an inch, with dimensions that can be edited in place.

## ADDED Requirements

### Requirement: Sketch view shows the plane head-on
Editing a sketch SHALL show a 2D SVG view looking at the plane from its normal side with v up. The view SHALL show a 1" grid with lighter 1/4" subdivisions when zoomed in enough for them to be at least 8 px apart, the plane's origin, coplanar reference faces as light fills, projected body outlines as faint lines, and the sketch's rectangles. The view SHALL support zoom with the wheel and pan by dragging with the middle button or with space held.

#### Scenario: Face sketch shows its face
- **WHEN** a sketch attached to a 24x24 face is opened
- **THEN** the view shows that face as a light filled rectangle in plane coordinates

### Requirement: Drawing a rectangle
With the rectangle tool active, pressing the mouse, dragging, and releasing SHALL create a rectangle whose corners are the snapped press and release positions. A drag that results in zero width or height SHALL create nothing. Width and height SHALL be shown live while dragging.

#### Scenario: Drag creates rectangle
- **WHEN** the user presses at snapped (2, 2) and releases at snapped (26, 32)
- **THEN** a rectangle with corners (2, 2) and (26, 32) is added to the sketch

### Requirement: Snapping
Pointer positions SHALL snap to the nearest 1/16" in u and v. When within 6 px of a reference face edge, a reference outline edge, or another rectangle's edge in the sketch, the position SHALL snap to that edge's coordinate instead, independently in u and v. The active snap SHALL be indicated visually.

#### Scenario: Snap to face edge
- **WHEN** the user drags a corner to within 6 px of a reference face edge at u = 24
- **THEN** the corner's u is exactly 24

#### Scenario: Grid snap
- **WHEN** the pointer is at a position that converts to u = 10.03"
- **THEN** the snapped u is 10"

### Requirement: Selection and deletion
With the select tool active, clicking a rectangle SHALL select it; shift-click SHALL add to or remove from the selection; clicking empty space SHALL clear it. Delete or Backspace SHALL remove selected rectangles. Selected rectangles SHALL be highlighted.

#### Scenario: Shift-click adds
- **WHEN** rectangle A is selected and the user shift-clicks rectangle B
- **THEN** both A and B are selected

### Requirement: Inline dimension editing
Each rectangle SHALL show its width and height as dimension labels. Clicking a label SHALL open a text input; Enter or blur SHALL commit a value parsed per `dimension-units`, Escape SHALL cancel, and an invalid value SHALL keep the input open with an error. Committing SHALL resize per the `sketch` size rule.

#### Scenario: Type a width
- **WHEN** the user clicks a width label showing `24"`, types `23 1/4`, and presses Enter
- **THEN** the rectangle's width is 23 1/4" and the label updates

### Requirement: Typed rectangle fields
The properties panel for a selected rectangle SHALL show editable lower-left u and v, width, and height, with the same parsing and error rules as inline editing.

#### Scenario: Move by typing position
- **WHEN** the user sets lower-left u to `12` in the panel
- **THEN** the rectangle moves so its lower-left u is 12" and its size is unchanged

### Requirement: Extrude from the sketch
A toolbar action SHALL create an extrude from the selected rectangles (all rectangles if none are selected), with the defaults from `extrude`, and open its properties for editing distance, operation, and target. The 3D view SHALL show the result as soon as the distance is set.

#### Scenario: Extrude selection
- **WHEN** two rectangles are selected and the user presses Extrude and enters distance `24`
- **THEN** an extrude feature referencing those two rectangles with distance 24" is appended and the 3D view shows the new body

### Requirement: Finishing a sketch
A Finish action SHALL leave sketch editing and return to the 3D view. The sketch SHALL remain in the timeline and MAY be reopened for editing from the timeline.

#### Scenario: Reopen sketch
- **WHEN** the user finishes Sketch 1 and later selects Edit on Sketch 1 in the timeline
- **THEN** the sketch view opens with Sketch 1's rectangles and reference geometry from its point in the timeline
