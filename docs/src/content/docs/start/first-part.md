---
title: Your First Part
description: Sketch a rectangle, extrude it, then sketch on its top face and cut a pocket.
sidebar:
  order: 3
---

This walkthrough builds a block with a pocket in its top. It touches every core idea: a sketch on a principal plane, an extrude, a sketch on a face, and a cut.

## Sketch on the front plane

1. Press **New sketch**. The default plane is XZ, the front plane, at offset 0. Press **Create**.
2. The sketch editor opens with the Rectangle tool active. Drag from the origin up and to the right to draw a rectangle. The width and height show live while you drag, snapped to a sixteenth.
3. Click the width label under the rectangle, type `24`, and press Enter. Do the same for the height. You now have a 24" square.

## Extrude it

1. Press **Extrude**. An extrude is added to the timeline and the 3D view opens with the new body and the extrude's properties.
2. The **Distance** field has focus. Type `24` and press Enter. The block is now a 24" cube.

The extrude went along the plane's normal. For the front plane that is away from you, so the block sits behind the plane you drew on.

## Sketch on a face

1. Press **Pick face**, then click the top of the cube. A new sketch opens on that face. The face is shown as a light fill so you can see where you are.
2. Draw a small rectangle inside the face. Snap pulls a corner onto a face edge when you get within a few pixels of it.
3. Press **Extrude**.

## Cut instead of join

The new extrude defaults to **Join** onto the body it was sketched on. Change it:

1. Set **Distance** to `2`.
2. Set **Direction** to "Against the normal (into the face)".
3. Set **Operation** to **Cut**.

The 3D view shows a 2" pocket with a floor and four walls.

## Change your mind

Click **Extrude 1** in the timeline and change its distance to `30`. The block gets deeper, the top face moves with it, and the pocket stays in the top. That is the timeline doing its job: the pocket's sketch references the face, not a coordinate.
