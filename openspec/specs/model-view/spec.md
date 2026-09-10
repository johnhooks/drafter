# model-view Specification

## Purpose
Shows the evaluated bodies in three dimensions so the user can see what they built, pick a face to sketch on, and pick a body as an extrude target.

## Requirements

### Requirement: Fixed isometric rendering
The 3D view SHALL render every evaluated body with an orthographic camera, Z up. The default view SHALL look from the front, right, and above. Hidden surfaces SHALL be hidden correctly regardless of body shape. Faces SHALL be shaded by their angle to the camera, lighter when facing it, and box edges SHALL be drawn as lines. The view SHALL support zoom with the wheel and pan by dragging with the middle button or with Space held. The view SHALL be orthographic; there is no perspective mode.

#### Scenario: Pocket is visible
- **WHEN** a body with a pocket in its top face is rendered
- **THEN** the pocket's floor and walls are visible and the top face shows the opening

#### Scenario: Back reads with depth
- **WHEN** the view is turned to look at the back of a body
- **THEN** its faces are shaded differently by orientation, not flat

### Requirement: Face picking
Clicking a body face SHALL identify the face as a reference per `sketch-planes` (extrude feature id and which face) and highlight it. Hovering SHALL highlight the face under the pointer.

#### Scenario: Click a cap face
- **WHEN** the user clicks the cap face of Extrude 1's box
- **THEN** the view reports a face reference to Extrude 1's cap

### Requirement: Start a sketch on a picked face
A New Sketch action SHALL offer the three principal planes with an offset field, or Pick Face, which waits for a face click in the 3D view. Choosing either SHALL append a sketch on that plane and open the sketch editor.

#### Scenario: Sketch on picked face
- **WHEN** the user chooses New Sketch, Pick Face, and clicks the top face of a body
- **THEN** a sketch attached to that face is appended and opened, showing the face as reference

### Requirement: Body selection
Clicking a body when not picking a face SHALL select that body, highlighting it and its creating extrude in the timeline. The selected body SHALL be offered as the default target when a new extrude needs one.

#### Scenario: Select body
- **WHEN** the user clicks a body
- **THEN** the body is highlighted and the timeline highlights the extrude that created it

### Requirement: Errored features are visible
Bodies affected by an errored feature SHALL render as if that feature were absent, and the timeline SHALL show the error next to the feature.

#### Scenario: Error shown
- **WHEN** Extrude 2 errors because its target is missing
- **THEN** the 3D view shows the model without Extrude 2 and the timeline marks Extrude 2 with the message

### Requirement: Pick a target body in the view
An extrude's properties SHALL offer a Pick in view action when its operation is join or cut. Choosing it SHALL wait for a click on a body in the 3D view; clicking a body created before the extrude SHALL set it as the target and return to the model view with the extrude selected. Clicking a body created after the extrude SHALL show a message and keep waiting. Escape SHALL cancel.

#### Scenario: Pick the cut target
- **WHEN** Extrude 7 is a cut with no target and the user chooses Pick in view then clicks the body from Extrude 2
- **THEN** Extrude 7's target is Extrude 2's body and it evaluates

### Requirement: Returning to the document settings
The timeline SHALL begin with a row for the document itself, showing its title, that is selected whenever no feature is selected. Choosing it SHALL clear the selection so the properties panel shows the document settings and parameters. In the model view, Escape with no pick in progress SHALL also clear the selection.

#### Scenario: Back to document settings
- **WHEN** an extrude is selected and the user clicks the document row at the top of the timeline
- **THEN** nothing is selected and the properties panel shows the document title and parameters

#### Scenario: Escape clears
- **WHEN** a body is selected in the model view and the user presses Escape
- **THEN** nothing is selected

### Requirement: Orbit by dragging
Dragging with the right mouse button, or with the left button while Alt is held, SHALL rotate the camera around the centre of the visible bodies, changing azimuth with horizontal movement and elevation with vertical movement. Elevation SHALL be limited so the camera never passes over the pole. Left click without Alt SHALL keep its picking behaviour.

#### Scenario: Turn to the side
- **WHEN** the user right-drags horizontally
- **THEN** the model turns about its vertical axis and picking a face afterwards still works

### Requirement: Snap to canonical views on release
When a drag ends with the camera within 8 degrees of one of the ten canonical views (front, back, left, right, top, bottom, and the four isometrics from above), the camera SHALL ease to that view. Otherwise it SHALL stay where it was released.

#### Scenario: Near the front
- **WHEN** the user releases a drag 5 degrees off the front view
- **THEN** the camera settles on the front view exactly

#### Scenario: Off any view
- **WHEN** the user releases a drag 20 degrees off every canonical view
- **THEN** the camera stays where it was released

### Requirement: View cube and keys
A view cube in the corner of the view SHALL show the current orientation. Clicking a face SHALL move to that orthographic view; clicking an edge SHALL look straight at that edge, midway between its two faces; clicking a corner SHALL move to the isometric from that corner, above or below. Keys 1 to 6 SHALL select front, back, left, right, top, and bottom; Home SHALL select the default isometric; F SHALL fit the visible bodies in the view. Keys SHALL be ignored while a text field has focus.

#### Scenario: Cube face
- **WHEN** the user clicks the cube's top face
- **THEN** the camera looks straight down the Z axis

#### Scenario: Cube edge
- **WHEN** the user clicks the edge between the front and right faces
- **THEN** the camera looks horizontally at that edge, halfway between the front and right views

#### Scenario: Fit
- **WHEN** bodies are partly off screen and the user presses F
- **THEN** every body is inside the view

### Requirement: The view is remembered
Orbit, zoom, and pan SHALL be written to the file's `view` and restored per `document-file`. Changing the view SHALL NOT create an undo entry.

#### Scenario: Reload keeps the angle
- **WHEN** the user turns to the back view and reloads
- **THEN** the back view is shown
