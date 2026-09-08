---
title: Planes and Sketches
description: The coordinate system, the three principal planes, and how a sketch attaches to a plane or a face.
sidebar:
  order: 1
---

The model uses a right-handed coordinate system with **Z up**. Looking at the front of a model, X runs to the right, Z runs up, and Y runs away from you.

## Principal planes

A sketch can sit on one of three planes at any offset along that plane's normal:

| Plane | You are looking at | u axis | v axis | Normal |
| --- | --- | --- | --- | --- |
| XZ | the front | X | Z | Y |
| XY | the top | X | Y | Z |
| YZ | the side | Y | Z | X |

Each plane has a **normal**, the direction "out of" the sketch. XZ defaults to a normal of -Y, facing you as the front viewer; XY defaults to +Z, up; YZ to +X, right. **Flip normal** in the New sketch menu turns a plane around to sketch from the other side.

Sketch coordinates are written (u, v). On the front plane u is X and v is Z, so a rectangle from (0, 0) to (24, 30) is 24" wide and 30" tall.

## Sketching on a face

Every face of a body is also a plane. **Pick face** waits for a click in the 3D view and opens a sketch on that face, with the normal pointing out of the body. The face shows as a light fill for reference, and every other body is drawn as faint outlines projected onto the plane.

A face sketch remembers which extrude created the face and which of its six faces it is, not a coordinate. If the extrude's distance changes, the sketch moves with the face. If a later cut removes the face entirely, the sketch reports an error rather than guessing.

:::note[Looking at a back face]
The sketch view always looks at a plane from its normal side with v up. On a plane whose normal points away from the default view, u reads right to left on screen. The indicator in the corner says which way each axis runs. See [Back faces](/sketch/back-faces/).
:::

## Rectangles

A sketch holds rectangles. Each has a handle such as `r1` that expressions use, and two values per axis that define it. See [Driven slots](/constraints/driven-slots/) for how those values can be numbers or expressions.
