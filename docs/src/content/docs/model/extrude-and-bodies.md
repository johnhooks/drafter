---
title: Extrude and Bodies
description: How rectangles become boxes, how boxes become bodies, and what join and cut do.
sidebar:
  order: 2
---

An extrude takes one or more rectangles from a sketch and sweeps each along the sketch plane's normal by a distance. Each rectangle becomes a box. What happens to the box depends on the operation.

## Distance and direction

**Distance** is a positive length. **Direction** is along the plane normal (out of the face) or against it (into the face). On a face sketch, "along" builds outward from the body and "against" goes into it, which is what a cut usually wants.

Distance accepts an expression over parameters, such as `ply`. See [Parameters](/constraints/parameters/).

## Operations

- **New body** creates a body from the boxes. Overlapping rectangles in one extrude merge into one body. The body takes the extrude's name.
- **Join** adds the boxes to a target body.
- **Cut** removes the boxes from a target body. A cut through a body leaves a hole; a cut that removes everything deletes the body.

An extrude from a face sketch defaults to Join onto the body that owns the face. An extrude from a principal plane defaults to New body. Join and cut need a target; the dropdown lists bodies that exist before the extrude in the timeline.

## Bodies

A body is a solid made of axis-aligned boxes. Joins and cuts are exact, so volumes and faces are always whole sixteenths. The 3D view draws each exposed face shaded by orientation, top lightest, front medium, side darkest, with the outline of every face as a line.

Click a body in the 3D view to select it. The timeline highlights the extrude that created it, and the properties panel shows that extrude.
