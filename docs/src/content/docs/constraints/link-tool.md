---
title: Link Tool
description: Constrain an edge to another edge at a distance by clicking, and read or change the result as a dimension.
sidebar:
  order: 2
---

The Link tool writes an edge constraint for you: click the edge to constrain, click the edge to measure from, type the distance.

## Make a link

1. Choose **Link** in the toolbar.
2. Click an edge of a rectangle. It is highlighted and labelled **constrain**. This edge will move.
3. Click a parallel edge of another rectangle, or an edge of the reference face. It is labelled **anchor**. This edge is not touched.
4. An input opens with the current distance between them. Type the distance you want and press Enter.

The constrained edge's slot becomes an expression such as `face.left + 2` or `r2.right - 3/4`. The sign is chosen so the edge stays on the side of the anchor it is on now. Escape cancels at any step.

Clicking a non-parallel edge, or a second edge of the same rectangle, shows a message and keeps waiting for an anchor. The [keep rule](/constraints/driven-slots/) applies when the slot is written; if it refuses, the tool reports why and changes nothing.

## Driving dimensions

Every simple link, a reference optionally plus or minus one number, is drawn as a dimension between the two edges with the distance as its label. Click the label to change the distance. **Dims** in the toolbar hides and shows them.

Driving dimensions start on the side of the rectangle away from the width and height labels: above for horizontal ones, left for vertical. Two on the same axis stack outward. To put one somewhere else, drag its line with the Select tool; it moves perpendicular to itself and can cross to the other side of the rectangle. Drag the label to slide it along the line, past the ends if the dimension is too short to hold it. A placement is kept with the document and undone with Cmd+Z like any edit; it disappears with its constraint.

Other expressions, such as `face.width / 2`, are shown as a small tag beside the edge rather than a dimension.

## See and remove relations

The sketch properties list every relation in the sketch as `r1.left = face.left + 2` with its current value. Click one to select it and highlight its dimension. The x beside it removes the relation, leaving the slot as a plain number equal to its current value, so nothing moves.

With the Select tool, clicking a dimension's label selects it too, and Delete removes it the same way.
