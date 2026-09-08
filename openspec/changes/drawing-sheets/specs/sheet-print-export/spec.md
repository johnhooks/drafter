## Purpose

Gets sheets onto paper at true scale and out as files.

## ADDED Requirements

### Requirement: Print at true scale
Printing SHALL output each sheet as one US letter page in the sheet's orientation with the editor hidden, at a size such that a 1:4 sheet's 24" dimension measures 6" on paper when printed at 100%. The user SHALL be able to print the current sheet or all sheets in order.

#### Scenario: Print all
- **WHEN** the document has three sheets and the user chooses Print All
- **THEN** the print preview shows three pages in sheet order, each in its own orientation

#### Scenario: Print current
- **WHEN** the user chooses Print Sheet on Sheet 2
- **THEN** the print preview shows only Sheet 2

### Requirement: SVG export per sheet
The user SHALL be able to download the current sheet as a standalone SVG sized 8 1/2" by 11" (or rotated for landscape) with embedded styles, including the title block and annotations. Isometric sheets SHALL embed the raster image.

#### Scenario: Export sheet
- **WHEN** the user exports Sheet 1
- **THEN** a file named from the document title and sheet name downloads and opens as the complete page in a browser
