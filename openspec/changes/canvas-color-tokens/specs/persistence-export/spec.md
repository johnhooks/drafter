## MODIFIED Requirements

### Requirement: Sketch SVG export
While editing a sketch, the user SHALL be able to download the sketch view as a standalone SVG containing the rectangles, their dimension labels, and the coplanar reference faces, with no dependency on app styles. The file SHALL carry the colours the view was drawn with under the current theme, as literal values, and a background in the canvas surface colour, so it reads as it did on screen.

#### Scenario: Export sketch
- **WHEN** the user exports Sketch 2
- **THEN** a file named from the document title and sketch name downloads and opens as a complete drawing in a browser

#### Scenario: Export from the dark theme
- **WHEN** the dark theme is chosen and the user exports a sketch
- **THEN** the file has a background rectangle in the dark canvas colour and its lines use the dark theme's line colour
