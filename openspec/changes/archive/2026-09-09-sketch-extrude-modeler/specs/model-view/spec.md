## Purpose

Shows the evaluated bodies in three dimensions so the user can see what they built, pick a face to sketch on, and pick a body as an extrude target.

## ADDED Requirements

### Requirement: Fixed isometric rendering
The 3D view SHALL render every evaluated body with an orthographic isometric camera looking from the front, right, and above with Z up. Hidden surfaces SHALL be hidden correctly regardless of body shape. Faces SHALL be shaded by orientation (top lightest, front medium, side darkest) and box edges SHALL be drawn as lines. The view SHALL support zoom with the wheel and pan by dragging with the middle button or with space held. The camera angle SHALL NOT change.

#### Scenario: Pocket is visible
- **WHEN** a body with a pocket in its top face is rendered
- **THEN** the pocket's floor and walls are visible and the top face shows the opening

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
