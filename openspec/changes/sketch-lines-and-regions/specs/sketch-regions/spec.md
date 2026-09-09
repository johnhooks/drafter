## Purpose

Defines the regions a sketch's lines enclose: how they are found, how one is named so that extrudes and face references can follow it through edits, how it turns into boxes, and how it fails.

## ADDED Requirements

### Requirement: Regions are the bounded areas enclosed by lines
Given a sketch's resolved non-construction lines, the system SHALL compute its regions: the maximal connected areas of the plane that are bounded on every side by lines and are not the unbounded outside. Two areas separated only by a line SHALL be different regions. A line that does not separate anything (a dangling line, or a line that ends inside an area) SHALL NOT create a region. Regions SHALL be derived on every evaluation and never stored.

#### Scenario: Four lines make one region
- **WHEN** a sketch has horizontal lines at v 0 and v 16 from u 0 to u 24 and vertical lines at u 0 and u 24 from v 0 to v 16
- **THEN** it has one region covering u 0 to 24, v 0 to 16

#### Scenario: A line splits a region
- **WHEN** a vertical line at u 10 from v 0 to v 16 is added to that sketch
- **THEN** it has two regions, u 0 to 10 and u 10 to 24

#### Scenario: A dangling line splits nothing
- **WHEN** instead a vertical line at u 10 from v 0 to v 8 is added
- **THEN** it still has one region covering u 0 to 24, v 0 to 16

#### Scenario: Unclosed lines make no region
- **WHEN** a sketch has three sides of a rectangle and no fourth
- **THEN** it has no regions

#### Scenario: Construction lines are ignored
- **WHEN** the vertical line at u 10 that split the region is marked construction
- **THEN** the sketch has one region again

#### Scenario: Overlapping collinear lines count once
- **WHEN** two horizontal lines at v 0 cover u 0 to 12 and u 8 to 24 and the other three sides close a 24 by 16 rectangle
- **THEN** there is one region covering u 0 to 24, v 0 to 16

### Requirement: A region is identified by its lower-left corner lines
Every region SHALL have a corner: the vertical line and the horizontal line that meet at the lower-left corner of its lowest, then leftmost, cell, chosen by sketch order when several collinear lines cover that corner. A region reference SHALL name a region by the ids of those two lines and SHALL resolve to the region whose interior lies just inside that corner toward +u and +v. If either line no longer exists, or no region lies inside that corner, resolving SHALL fail with a message naming the lines.

#### Scenario: Reference follows the lines
- **WHEN** an extrude references the region at the corner of `l1` and `l2` and `l1`'s position changes from u 0 to u 2
- **THEN** the extrude's region is the one now enclosed with its lower-left at u 2

#### Scenario: Split keeps the corner part
- **WHEN** a region referenced by its corner at u 0, v 0 is split by a vertical line at u 10
- **THEN** the reference resolves to the part from u 0 to 10

#### Scenario: Opened loop
- **WHEN** the top line of the only region is deleted
- **THEN** every reference to that region fails with a message saying no region is enclosed at that corner

#### Scenario: Corner line deleted
- **WHEN** the vertical line named by a reference is deleted and the remaining lines still enclose the area
- **THEN** the reference fails with a message naming the deleted line

### Requirement: Regions decompose into rectangles
Each region SHALL decompose into a list of disjoint axis-aligned rectangles in plane coordinates whose union is the region, and SHALL expose its bounding rectangle and area. The decomposition SHALL depend only on the region's shape, so adding a line elsewhere in the sketch SHALL NOT change it.

#### Scenario: L shape
- **WHEN** a region is an L of 24 by 24 with a 12 by 12 notch out of its upper right
- **THEN** its area is 432 square inches, its bounds are 24 by 24, and its rectangles cover exactly the L

### Requirement: Region boundaries name their faces
Each region SHALL expose its boundary as a list of edges, each with the id of the line that bounds it there and the outward direction, so that a face of the region's extrusion can be named by line and direction. An edge bounded by several collinear lines SHALL name the first in sketch order.

#### Scenario: Rectangle boundary
- **WHEN** a region is the rectangle bounded by `l1` left, `l2` bottom, `l3` right, `l4` top
- **THEN** its boundary has four edges: `l1` outward -u, `l2` outward -v, `l3` outward +u, `l4` outward +v

#### Scenario: Shared splitting line
- **WHEN** `l5` splits a rectangle into left and right regions
- **THEN** the left region's boundary names `l5` outward +u and the right region's names `l5` outward -u
