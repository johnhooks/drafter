---
title: Back Faces
description: Why a sketch on the far side of a body reads mirrored, and how to tell.
sidebar:
  order: 3
---

The sketch editor looks at a plane from the side its normal points to, with v up. For the front plane and the top plane that puts u left to right, as you would expect. For a face on the far side of a body, or a principal plane you flipped, the normal points away from the default 3D view, and the editor looks at it from behind.

On such a plane, u runs right to left on screen. Dragging to the right decreases u. The rectangle's coordinates are still correct in the model; only the view is mirrored, exactly as if you walked round the part.

:::caution[Check the indicator]
The bar at the bottom of the sketch view says which axis runs which way, for example "YZ plane, viewed from -X. Y left, Z up." When it says "left", the plane is being viewed from behind.
:::

The width and height labels and the properties panel are unaffected: width is always the u extent, height the v extent, regardless of which way the view reads.
