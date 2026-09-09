---
title: Tools and Snapping
description: The sketch tools, the mouse and keyboard, and how snapping chooses a point.
sidebar:
  order: 1
---

The sketch editor shows a plane head on with a 1" grid, finer quarter-inch lines when zoomed in, the origin, reference geometry from the model, the sketch's lines, and the regions they enclose as light fills.

## Navigation

| Action | Mouse or key |
| --- | --- |
| Zoom | Wheel, around the pointer |
| Pan | Middle button drag, or hold Space and drag |
| Cancel a drag or a tool step | Escape |
| Undo, redo | Cmd+Z and Cmd+Shift+Z on a Mac, Ctrl elsewhere. Inside a text field the field's own undo applies |

The 3D view uses the same gestures for zoom and pan, and adds orbit:

| Action | Mouse or key |
| --- | --- |
| Orbit | Right button drag, or Alt with the left button |
| Snap to a view | Release within a few degrees of a face view or an isometric and the camera settles on it; further away it stays where you left it |
| Front, back, left, right, top, bottom | 1 to 6 |
| Default isometric | Home |
| Fit the model | F |
| View cube | Bottom right corner; click a face for a straight view, an edge to look straight at that edge, a corner for an isometric from above or below |

The view is orthographic from every angle, so parallel edges stay parallel. The six face views read to scale like a drawing. The camera is saved with the file and never undone.

## Tools

- **Select.** Click a line to select it, or click inside a region to select the region; a line within a few pixels wins over the region under it. Shift-click adds or removes; click empty space to clear. Delete removes the selected lines, the lines that bound only the selected regions, or a selected constraint dimension. **X** toggles construction on the selected lines.
- **Line.** Click to start, click to end. The line runs along whichever axis you moved farther, so it is always horizontal or vertical, and the next line starts where the last one ended. Escape or Enter ends the chain. An end that lands on a perpendicular line is attached to it, and a plain end of an existing line that the new line passes through attaches too, so a chain of four lines closes into a rectangle that stays closed when a side moves.
- **Rectangle.** Press, drag, release. The width and height show while you drag. A drag with zero width or height creates nothing. The result is four attached lines.
- **Link.** Constrains one line's position to a parallel line or face edge. See [Link tool](/constraints/link-tool/).

The four tools sit together in the toolbar; arrow keys move between them once one has focus. **Dims** shows and hides driving dimensions.

:::note[Construction lines]
A construction line, toggled with **X** or the checkbox in its properties, is drawn dashed. It snaps and can be named in expressions like any line, but it never bounds a region: a construction line across a region leaves the region whole.
:::

**Extrude** in the toolbar creates an extrude from the selected regions, or from all of them when none is selected, and is unavailable while the sketch encloses nothing. **Finish** returns to the 3D view; the sketch stays in the timeline. Export of the sketch as SVG is in the menu at the right of the toolbar.

## Snapping

The pointer always lands on a whole sixteenth. Before that, two snaps take priority, and the indicator changes shape to say which:

1. **Corner.** Within 6 pixels of a corner of a reference face, a body outline, or an end of a sketch line, the pointer takes that point exactly. Square indicator.
2. **Edge.** Within 6 pixels of any such edge or of a sketch line, the pointer takes that coordinate on that axis only, so you can slide along a face edge or a line. Round indicator.
3. **Grid.** Otherwise, the nearest sixteenth. No indicator.

Snapping onto a face edge does not create a relation; use the Link tool or type an expression for that. Snapping a line's end onto another sketch line does attach it, because a corner that did not follow its lines would open the outline.
