---
title: Link Tool
description: Constrain a line to a parallel line or face edge at a distance by clicking, and read or change the result as a dimension.
sidebar:
  order: 2
---

The Link tool writes a position constraint for you: click the line to constrain, click the line or face edge to measure from, type the distance.

## Make a link

1. Choose **Link** in the toolbar.
2. Click a line. It is highlighted and labelled **constrain**. This line will move.
3. Click a parallel line, or a parallel edge of the reference face. It is labelled **anchor**. This is not touched.
4. An input opens with the current distance between them. Type the distance you want and press Enter.

The constrained line's position becomes an expression such as `face.left + 2` or `l4.at - 3/4`. The sign is chosen so the line stays on the side of the anchor it is on now. Escape cancels at any step. Linking a line that is already linked replaces the old relation.

Clicking a non-parallel line or edge, or the same line twice, shows a message and keeps waiting for an anchor.

## Driving dimensions

Every simple link, a reference optionally plus or minus one number, is drawn as a dimension between the two lines with the distance as its label. Click the label to change the distance. The **Dimensions** toggle in the toolbar hides and shows them.

A dimension across two vertical lines starts above the top end of the constrained line; one across two horizontal lines starts left of its left end. Two that overlap on the same edge stack outward. To put one somewhere else, drag its line with the Select tool; it moves perpendicular to itself and can run down along the line and out past its other end. Drag the label to slide it along the dimension, past the ends if the dimension is too short to hold it. A placement is kept with the document and undone with Cmd+Z like any edit; it disappears with its constraint.

The corners of a rectangle are relations too, an end attached to a perpendicular line's position, but they draw nothing and are not listed: a corner is not a dimension. Other expressions, such as `face.width / 2`, are shown as a small tag beside the line rather than a dimension.

## See and remove relations

The sketch properties list every relation in the sketch other than corner attachments, as `l1.at = face.left + 2` with its current value. Click one to select it and highlight its dimension. The x beside it removes the relation, leaving the slot as a plain number equal to its current value, so nothing moves.

With the Select tool, clicking a dimension's label selects it too, and Delete removes it the same way.
