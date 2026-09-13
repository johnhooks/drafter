## MODIFIED Requirements

### Requirement: SVG export per sheet
The user SHALL be able to download the current sheet as a standalone SVG sized 8 1/2" by 11" (or rotated for landscape) with embedded styles, including the view and the title block, with no dependency on app styles. An isometric sheet's export SHALL embed its raster image as a data URL so the file stays standalone.

#### Scenario: Export sheet
- **WHEN** the user exports Sheet 1
- **THEN** a file named from the document title and sheet name downloads and opens as the complete page in a browser

#### Scenario: Export an isometric sheet
- **WHEN** the user exports an isometric sheet
- **THEN** the file contains an image element with an embedded data URL and opens showing the rendering
