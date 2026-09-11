## MODIFIED Requirements

### Requirement: Theme choice
The application SHALL offer a theme setting with the values light and dark. Choosing one SHALL restyle the panels and the sketch view immediately, the sketch view taking its surface, grid, geometry, selection, constraint, and reference colours from the theme. The default SHALL be light.

#### Scenario: Switch to dark
- **WHEN** the user chooses the dark theme
- **THEN** the panels use the dark theme without a reload

#### Scenario: The sketch follows the theme
- **WHEN** a sketch is open and the user chooses the dark theme
- **THEN** the canvas background and the sketch's lines change to the dark theme's colours without a reload, and back when light is chosen
