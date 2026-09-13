## Purpose

Defines a printable sheet: a letter page with one view of the model at a standard scale and a title block, kept in the document and kept current with the model.

## ADDED Requirements

### Requirement: A document holds an ordered list of sheets
Sheets SHALL be stored in the document in order, each with a unique id and a name defaulting to Sheet 1, Sheet 2, and so on. A persisted `nextSheetNumber` counter SHALL assign the next default name and advance on creation; deleting or renaming a sheet SHALL NOT reduce it. When absent, the counter SHALL default to one past the highest numbered sheet name, or 1 with no numbered sheets. Sheets and the counter SHALL be saved and loaded with the document JSON per `document-file`. A document JSON without a sheets list SHALL load with no sheets.

#### Scenario: Older file loads
- **WHEN** a version 5 document without a sheets key is loaded
- **THEN** it loads with zero sheets and no error

#### Scenario: Names count past deletions
- **WHEN** a document has Sheet 1 and Sheet 2, Sheet 2 is deleted, and a sheet is added
- **THEN** the new sheet is Sheet 3

#### Scenario: Names count past reload
- **WHEN** Sheet 2 is deleted, the file is saved and reloaded, and a sheet is added
- **THEN** the new sheet is Sheet 3

#### Scenario: Import without a counter
- **WHEN** a file containing Sheet 1 and Sheet 2 without a counter is loaded, then Sheet 2 is deleted or renamed and another sheet is added
- **THEN** the new sheet is Sheet 3, including after saving and reloading between edits

### Requirement: Sheet page and view settings
A sheet SHALL have: page orientation, portrait or landscape, on US letter (8 1/2" by 11") with 1/2" margins; a view kind of front, top, left, or right; a target of the whole model or one body id; and a scale from the list 1:1, 1:2, 1:4, 1:8, 1:12, 1:16, 1:24. New sheets SHALL default to landscape, front, whole model, and the largest listed scale at which the view fits the drawing area.

#### Scenario: Default scale fits
- **WHEN** a new sheet is created for a model 60" wide and 36" tall
- **THEN** the sheet is landscape and its scale is 1:8

#### Scenario: Scale too large warns
- **WHEN** the user picks 1:1 for a model 60" wide
- **THEN** the sheet shows a warning that the view exceeds the drawing area and still draws it, clipped

### Requirement: The view is centred in the drawing area
The drawing area SHALL be the page inside the margins less the title block. The view SHALL be drawn centred in that area at the chosen scale, visible segments as solid lines and hidden segments as dashed lines, with line weights and dash lengths fixed in paper inches. Paper coordinates SHALL be inches on the page; view coordinates SHALL map to paper by the scale and the centring offset.

#### Scenario: Centred view
- **WHEN** a 24" by 30" front view is placed on a landscape sheet at 1:4
- **THEN** it is drawn 6" by 7 1/2" centred in the drawing area

#### Scenario: Hidden edges dashed
- **WHEN** a sheet shows the front view of a body with a pocket in its top
- **THEN** the pocket's edges are drawn dashed inside a solid outline

### Requirement: Sheets follow the model
A sheet's view SHALL be regenerated from the current evaluated model whenever the model changes. A sheet targeting a body that no longer exists SHALL show an empty view and a warning naming the body.

#### Scenario: Model edit updates sheet
- **WHEN** an extrude distance changes
- **THEN** every sheet showing that body redraws with the new geometry

#### Scenario: Target body gone
- **WHEN** the extrude that made a sheet's target body is deleted
- **THEN** the sheet draws nothing and its warnings name the missing body

### Requirement: Title block
Every sheet SHALL draw a title block in the lower right of the page containing the document title, sheet name, view name, scale, the date the document was last changed, and sheet number of total, plus a 1" reference bar so a print can be checked against a rule.

#### Scenario: Title block content
- **WHEN** the second of three sheets named Case Front at 1:4 is drawn on 2026-09-08
- **THEN** its title block reads the document title, Case Front, Front, 1:4, 2026-09-08, and Sheet 2 of 3
