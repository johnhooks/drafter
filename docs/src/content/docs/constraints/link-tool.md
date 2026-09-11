---
title: Link Tool
description: Constrain a line to a parallel line or face edge at a distance by clicking, and read or change the result on the sketch.
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

## Constraints in the sketch

Every simple link, a reference optionally plus or minus one number, is drawn as a measured line between the two lines with the distance as its label, in amber. Click the label to change the distance. The anchor can be a face edge, another line, or a rectangle's side or middle, `r1.right + 1`, which measures from the line that makes that side.

The **Constraints** toggle in the toolbar, on by default, draws every constraint in the sketch, and the ones on the line you point at or select are highlighted. With it off, a constraint appears only while its line is hovered or selected, or while it is selected in the list below, and each driven slot carries a short amber tick instead: across the middle of a line whose position is an expression, across the end of a line whose end is. The tick is the sign that the line follows something. Whenever a constraint is shown by pointing, selecting, or picking it from the list, the edge it measures from lights up in violet, so the pair reads together; the toggle alone lights nothing.

:::note[A constraint is not a dimension]
What the sketch draws explains a formula and is not printed. Dimensions that document a part are placed by hand on a drawing sheet.
:::

A constraint across two vertical lines starts above the top end of the constrained line; one across two horizontal lines starts left of its left end. Two that overlap on the same edge stack outward. To put one somewhere else, drag its line with the Select tool; it moves perpendicular to itself and can run down along the line and out past its other end. Drag the label to slide it along the line, past the ends if it is too short to hold the text. A placement is kept with the document and undone with Cmd+Z like any edit; it disappears with its constraint, and it applies however the constraint came to be shown.

The corners of a rectangle are relations too, an end attached to a perpendicular line's position, but they draw nothing, carry no tick, and are not listed: a corner is not a constraint you placed. Other expressions, such as `face.width / 2`, are shown as a small tag beside the line.

## See and remove relations

The sketch properties list every relation in the sketch other than corner attachments, as `l1.at = face.left + 2` with its current value. Click one to select it and draw it highlighted in the sketch, whether or not the toggle is on. The x beside it removes the relation, leaving the slot as a plain number equal to its current value, so nothing moves.

With the Select tool, clicking a drawn constraint's label selects it too, and Delete removes it the same way.
