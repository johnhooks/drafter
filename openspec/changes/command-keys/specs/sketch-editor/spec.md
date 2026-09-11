## MODIFIED Requirements

### Requirement: Selection and deletion
With the select tool active, clicking a line SHALL select it; clicking inside a region and not on a line SHALL select the region; shift-click SHALL add to or remove from the selection; clicking empty space SHALL clear it. Lines and regions MAY be selected together. The delete command, bound to Delete and Backspace by default, SHALL remove selected lines per `sketch` and, when only regions are selected, the lines that bound only those regions. Selected lines and regions SHALL be highlighted, and the line or region under the pointer SHALL be highlighted lightly.

#### Scenario: Shift-click adds
- **WHEN** region A is selected and the user shift-clicks region B
- **THEN** both A and B are selected

#### Scenario: Line wins over region
- **WHEN** the user clicks within 6 px of a line that bounds a region
- **THEN** the line is selected and the region is not

### Requirement: Construction toggle
The construction command, bound to X by default, or a checkbox in the line properties, SHALL toggle construction on the selected lines. Construction lines SHALL be drawn dashed and lighter.

#### Scenario: Toggle with the key
- **WHEN** a line that splits a region is selected and the user presses X
- **THEN** the line is dashed and the two regions merge into one

## ADDED Requirements

### Requirement: Tools switch by key
Each sketch tool SHALL be a command per `commands`, bound by default to A for Select, L for Line, R for Rectangle, and D for Link, and its toolbar button SHALL show the chord in its tooltip. Switching tools by key SHALL cancel any drag or chain in progress in the previous tool.

#### Scenario: Switch mid-chain
- **WHEN** the user has started a line chain and presses A
- **THEN** the chain ends without adding a line and the Select tool is active
