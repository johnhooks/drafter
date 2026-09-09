## MODIFIED Requirements

### Requirement: Fixed isometric rendering
The 3D view SHALL render every evaluated body with an orthographic camera, Z up. The default view SHALL look from the front, right, and above. Hidden surfaces SHALL be hidden correctly regardless of body shape. Faces SHALL be shaded by their angle to the camera, lighter when facing it, and box edges SHALL be drawn as lines. The view SHALL support zoom with the wheel and pan by dragging with the middle button or with Space held. The view SHALL be orthographic; there is no perspective mode.

#### Scenario: Pocket is visible
- **WHEN** a body with a pocket in its top face is rendered
- **THEN** the pocket's floor and walls are visible and the top face shows the opening

#### Scenario: Back reads with depth
- **WHEN** the view is turned to look at the back of a body
- **THEN** its faces are shaded differently by orientation, not flat

## ADDED Requirements

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
A view cube in the corner of the view SHALL show the current orientation; clicking one of its faces SHALL move to that orthographic view, and clicking an edge or corner SHALL move to the nearest isometric. Keys 1 to 6 SHALL select front, back, left, right, top, and bottom; Home SHALL select the default isometric; F SHALL fit the visible bodies in the view. Keys SHALL be ignored while a text field has focus.

#### Scenario: Cube face
- **WHEN** the user clicks the cube's top face
- **THEN** the camera looks straight down the Z axis

#### Scenario: Fit
- **WHEN** bodies are partly off screen and the user presses F
- **THEN** every body is inside the view

### Requirement: The view is remembered
Orbit, zoom, and pan SHALL be written to the file's `view` and restored per `document-file`. Changing the view SHALL NOT create an undo entry.

#### Scenario: Reload keeps the angle
- **WHEN** the user turns to the back view and reloads
- **THEN** the back view is shown
