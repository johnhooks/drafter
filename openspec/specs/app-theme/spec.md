# app-theme Specification

## Purpose
Lets the user pick the light or dark panel theme and keeps the choice between visits.

## Requirements

### Requirement: Theme choice
The application SHALL offer a theme setting with the values light and dark. Choosing one SHALL restyle the panels immediately. The default SHALL be light.

#### Scenario: Switch to dark
- **WHEN** the user chooses the dark theme
- **THEN** the panels use the dark theme without a reload

### Requirement: Theme is remembered
The chosen theme SHALL be saved in browser storage separately from the document and restored when the app opens. Opening a different document SHALL NOT change the theme.

#### Scenario: Reload keeps the theme
- **WHEN** the user chooses dark and reloads
- **THEN** the panels open in the dark theme
