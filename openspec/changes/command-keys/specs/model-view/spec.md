## MODIFIED Requirements

### Requirement: View cube and keys
A view cube in the corner of the view SHALL show the current orientation. Clicking a face SHALL move to that orthographic view; clicking an edge SHALL look straight at that edge, midway between its two faces; clicking a corner SHALL move to the isometric from that corner, above or below. The view commands per `commands`, bound by default to 1 to 6 for front, back, left, right, top, and bottom, Home for the default isometric, and F to fit the visible bodies, SHALL move the camera the same way. Keys SHALL be ignored while a text field has focus.

#### Scenario: Cube face
- **WHEN** the user clicks the cube's top face
- **THEN** the camera looks straight down the Z axis

#### Scenario: Cube edge
- **WHEN** the user clicks the edge between the front and right faces
- **THEN** the camera looks horizontally at that edge, halfway between the front and right views

#### Scenario: Fit
- **WHEN** bodies are partly off screen and the user presses F
- **THEN** every body is inside the view
