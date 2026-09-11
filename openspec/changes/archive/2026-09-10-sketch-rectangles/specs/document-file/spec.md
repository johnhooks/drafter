## MODIFIED Requirements

### Requirement: Earlier versions load
Version 1 to 4 files SHALL load, be converted to version 5, and be saved as version 5. Converting a version 3 model SHALL turn each rectangle into four lines attached at their endpoints and a rectangle record with the rectangle's original handle, with the rectangle's driven slots becoming the lines' positions (a driven size becoming the far line's position as an expression over the near line), assign line handles in order, leave expressions that name rectangle properties unchanged, turn each extrude's rectangle ids into references to the region at each rectangle's lower-left corner, turn each face reference into the matching cap, base, or side reference, and carry dimension placements to the corresponding line slots and region labels. An extrude of a rectangle that other rectangles' lines subdivide SHALL reference only the region at that rectangle's lower-left corner; the other parts are not extruded until the user adds them. A version 4 model SHALL load unchanged with no rectangle records; its line expressions stay as written.

#### Scenario: Version 3 rectangle
- **WHEN** a version 3 file with a rectangle `r1` with u min 0, u max 384, v min 0, v max 384 and an extrude of `r1` is opened
- **THEN** it loads as version 5 with four attached lines enclosing that square, a rectangle `r1` over them, and an extrude referencing the region at the corner of its left and bottom lines, and evaluates to the same body

#### Scenario: Version 3 expressions
- **WHEN** a version 3 rectangle `r2` has u min `r1.right + 1`
- **THEN** after conversion the corresponding vertical line's position is still `r1.right + 1` and resolves through `r1`'s right line

#### Scenario: Subdivided rectangle keeps its corner region
- **WHEN** a version 3 file has `r2` entirely inside `r1` and an extrude of `r1`
- **THEN** after conversion the extrude references the region at `r1`'s lower-left corner, which excludes `r2`'s area

#### Scenario: Version 4 file
- **WHEN** a version 4 file with lines and no rectangle records is opened
- **THEN** it loads as version 5 with the same lines, no rectangles, and its expressions unchanged

#### Scenario: Version 2 file
- **WHEN** a version 2 file is opened
- **THEN** it loads with its features intact and the default view
