---
title: Tools and Snapping
description: The sketch tools, the mouse and keyboard, and how snapping chooses a point.
sidebar:
  order: 1
---

The sketch editor shows a plane head on with a 1" grid, finer quarter-inch lines when zoomed in, the origin, reference geometry from the model, and the sketch's rectangles.

## Navigation

| Action | Mouse or key |
| --- | --- |
| Zoom | Wheel, around the pointer |
| Pan | Middle button drag, or hold Space and drag |
| Cancel a drag or a tool step | Escape |
| Undo, redo | Cmd+Z and Cmd+Shift+Z on a Mac, Ctrl elsewhere. Inside a text field the field's own undo applies |

The 3D view uses the same gestures. Its angle is fixed.

## Tools

- **Select.** Click a rectangle to select it; shift-click to add or remove one; click empty space to clear. Delete removes the selected rectangles, or a selected constraint dimension.
- **Rectangle.** Press, drag, release. The width and height show while you drag. A drag with zero width or height creates nothing.
- **Link.** Creates a constraint between two edges. See [Link tool](/constraints/link-tool/).

**Extrude** in the toolbar creates an extrude from the selected rectangles, or from all of them when none is selected. **Finish** returns to the 3D view; the sketch stays in the timeline.

## Snapping

The pointer always lands on a whole sixteenth. Before that, two snaps take priority, and the indicator changes shape to say which:

1. **Corner.** Within 6 pixels of a corner of a reference face, a body outline, or another rectangle, the pointer takes that corner exactly. Square indicator.
2. **Edge.** Within 6 pixels of any such edge, the pointer takes that edge's coordinate on that axis only, so you can slide along a face edge. Round indicator.
3. **Grid.** Otherwise, the nearest sixteenth. No indicator.

Snapping does not create a relation. To make a rectangle follow an edge, use the Link tool or type an expression.
