---
title: Extrude and Bodies
description: How regions become boxes, how boxes become bodies, and what join and cut do.
sidebar:
  order: 2
---

An extrude takes one or more regions from a sketch and sweeps each along the sketch plane's normal by a distance. A rectangular region becomes one box; an L-shaped one becomes the boxes that make it up. What happens to the boxes depends on the operation.

In the sketch editor, **Extrude** takes the selected regions, or every region when none is selected. Click inside a region with the Select tool to select it; shift-click adds another. Regions extruded together form one operation.

:::note[A split keeps the corner]
An extrude remembers each region by the two lines at its lower-left corner. If you later draw a line across that region, the extrude keeps the part that still touches that corner and the other part is not extruded until you add it. Delete a bounding line so the outline no longer closes and the extrude reports that no region is enclosed there.
:::

## Distance and direction

**Distance** is a positive length. **Direction** is along the plane normal (out of the face) or against it (into the face). On a face sketch, "along" builds outward from the body and "against" goes into it, which is what a cut usually wants.

Distance accepts an expression over parameters, such as `ply`. See [Parameters](/constraints/parameters/).

## Operations

- **New body** creates a body from the boxes. Regions in one extrude that touch or overlap merge into one body. The body takes the extrude's name.
- **Join** adds the boxes to a target body.
- **Cut** removes the boxes from a target body. A cut through a body leaves a hole; a cut that removes everything deletes the body.

An extrude from a face sketch defaults to Join onto the body that owns the face. An extrude from a principal plane defaults to New body. Join and cut need a target; the dropdown lists bodies that exist before the extrude in the timeline.

## Bodies

A body is a solid made of axis-aligned boxes. Joins and cuts are exact, so volumes and faces are always whole sixteenths. The 3D view draws each exposed face shaded by orientation, top lightest, front medium, side darkest, with the outline of every face as a line.

Click a body in the 3D view to select it. The timeline highlights the extrude that created it, and the properties panel shows that extrude.
