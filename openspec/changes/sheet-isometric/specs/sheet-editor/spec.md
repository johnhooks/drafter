## MODIFIED Requirements

### Requirement: Sheet settings panel
The properties panel for a sheet SHALL edit its name, orientation, view kind, target (whole model or a body chosen from the timeline's bodies), and scale, and SHALL show the sheet's warnings. The scale field SHALL be disabled while the view kind is isometric.

#### Scenario: Change view kind
- **WHEN** the user changes the view from front to top
- **THEN** the sheet redraws with the top projection and the title block reads Top

#### Scenario: Scale disabled for isometric
- **WHEN** the user changes the view to isometric
- **THEN** the scale field is disabled and re-enables when the view is set back to front

### Requirement: Dimension tool
With the dimension tool active, clicking a first snapped point, then a second, then a position for the dimension line SHALL create a dimension. Orientation SHALL be chosen by the third click: moving mostly perpendicular to the points' u span makes it horizontal, otherwise vertical, with a live preview. Escape SHALL cancel at any step. The tool SHALL be unavailable on an isometric sheet, and switching to an isometric sheet while it is active SHALL select the select tool.

#### Scenario: Place a horizontal dimension
- **WHEN** the user clicks two corners of a box's bottom edge and then clicks below them
- **THEN** a horizontal dimension of the box's width appears below the box

#### Scenario: Unavailable on isometric
- **WHEN** an isometric sheet is selected
- **THEN** the Dimension button is disabled and D does nothing
