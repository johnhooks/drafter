## MODIFIED Requirements

### Requirement: Driving dimensions are drawn for simple links
For every driven slot whose expression is a single reference optionally plus or minus one literal, the sketch view SHALL draw a dimension between the anchor edge and the driven edge with the literal's absolute value as its label (or `0"` for a bare reference). Where the dimension is drawn SHALL follow `sketch-dimension-layout`: the slot's stored placement when it has one, otherwise the automatic placement on the side opposite the size labels. Other expressions SHALL be shown as a small tag with the expression text beside the driven edge.

#### Scenario: Dimension drawn
- **WHEN** `r1`'s u min is `face.left + 2` and has no placement
- **THEN** a dimension from the face's left edge to `r1`'s left edge reads `2"` above the rectangle

#### Scenario: Dimension drawn at a placement
- **WHEN** that slot has a stored offset of -2" and label fraction 1
- **THEN** the dimension is drawn 2" below the rectangle's bottom edge with its label at the driven end
