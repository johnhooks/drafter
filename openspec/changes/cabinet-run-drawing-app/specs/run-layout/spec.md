## Purpose

Turns a document into positioned boxes and counter and toe kick segments that the views draw, and reports layout problems as warnings.

## ADDED Requirements

### Requirement: Items are positioned by row order
Within a row, the first item SHALL start at the wall's left end (x = 0). Each following item SHALL start where the previous item ends. Fillers and space items SHALL take up width like any other item.

#### Scenario: Offsetting a row with space
- **WHEN** the upper row is a 30" space followed by a 36" upper cabinet
- **THEN** the upper cabinet's resolved x is 30"

### Requirement: Vertical placement by item kind
Base cabinets, tall cabinets, appliances, and base row fillers SHALL sit on the floor (y = 0). Upper cabinets SHALL have their bottom at their resolved bottom height. Upper row fillers SHALL match the bottom and height of the nearest upper cabinet in the row, or the upper defaults if the row has none.

#### Scenario: Tall cabinet on the floor
- **WHEN** a tall cabinet with height 84" is laid out
- **THEN** its box spans y = 0 to y = 84"

### Requirement: Depth placement from the wall
Every box SHALL have its back at the wall face (z = 0) and extend forward by its resolved depth. Fillers SHALL take the depth of the row's cabinet default.

#### Scenario: Upper over base
- **WHEN** an upper of default depth sits over a base of default depth
- **THEN** the upper's front is at z = 12" and the base's front is at z = 24"

### Requirement: Counter segments run over the base row
The layout SHALL produce counter segments: a slab of the counter thickness default sitting on top of the base row, spanning every contiguous stretch of base cabinets, fillers, and appliances whose counter flag is set. The counter SHALL be interrupted by tall cabinets, space items, and appliances whose counter flag is not set. Each segment's depth SHALL be the base depth default plus the counter overhang default.

#### Scenario: Counter interrupted by range
- **WHEN** the base row is a 36" base, a 30" range, and a 36" base
- **THEN** there are two counter segments, 0" to 36" and 66" to 102"

#### Scenario: Counter runs over dishwasher
- **WHEN** the base row is a 36" base, a 24" dishwasher, and a 36" base
- **THEN** there is one counter segment from 0" to 96"

### Requirement: Toe kick segments under base and tall cabinets
The layout SHALL produce toe kick segments under every base and tall cabinet using the toe kick height and recess defaults. Appliances, fillers, and space SHALL NOT get toe kicks.

#### Scenario: Toe kick under a base cabinet
- **WHEN** a 36" base cabinet of depth 24" is laid out with a 4" high, 3" recessed toe kick
- **THEN** a toe kick segment spans x 0" to 36", height 4", front at z = 21"

### Requirement: Layout warnings do not block drawing
The layout SHALL return a list of warnings alongside the boxes. It SHALL warn when a row's total width exceeds the wall width, when an upper cabinet overlaps in x and y with a tall cabinet or an appliance, when any box's top exceeds the ceiling height, and when an upper cabinet's bottom is below the counter top beneath it. Warnings SHALL name the items involved. The views SHALL still draw every box.

#### Scenario: Row wider than wall
- **WHEN** the wall is 120" and the base row totals 126"
- **THEN** a warning states the base row exceeds the wall by 6"

#### Scenario: Upper collides with refrigerator
- **WHEN** a 36" upper at x = 0 has bottom 54" and a 70" tall refrigerator sits at x = 0
- **THEN** a warning names the upper and the refrigerator
