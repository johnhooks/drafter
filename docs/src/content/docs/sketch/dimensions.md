---
title: Sizes and Editing
description: Reading and typing sizes on the sketch and in the properties panel.
sidebar:
  order: 2
---

Point at a region and its width appears under its bottom edge and its height beside its right edge, in blue. Point at a line that bounds no region and its length appears beside it. The labels stay while the pointer moves to them, and they stay for anything selected. To see every size at once, turn on **Sizes** in the toolbar. Labels can be moved: with the Select tool, drag one along its edge to slide it, or away from the edge to push it further out or to the other side. A short press without moving opens it for editing.

:::note[Nothing is labelled unasked]
A finished sketch shows lines, fills, and its constraints, and nothing else. Handles and sizes are there when you hover, select, or turn their toggle on. While a length field has focus every line shows its handle, so `l3` is on the canvas as you type it.
:::

## Type a size on the sketch

Click a width or height label. An input opens with the current value. Type a new one and press Enter, or click away to commit. Escape cancels. A value that does not parse keeps the input open and shows why.

Typing a region's width moves every line on its right edge so the region is that wide; the left edge stays. Typing a height moves the top edge. If a line that would move is held by an expression, the edit is refused and the message names it. Typing a free line's length keeps its first end and moves the other; see [Driven slots](/constraints/driven-slots/).

## Length notation

Anywhere a length is typed, these forms work:

| You type | Meaning |
| --- | --- |
| `24` | 24" |
| `35 1/4` or `35-1/4` | 35 1/4" |
| `3/4` | 3/4" |
| `35.3` | rounded to the nearest sixteenth, 35 5/16" |
| `24"` or `24 in` | the unit mark is ignored |

Negative lengths are rejected. Lengths display with reduced fractions: `35 1/2"`, `3/4"`, `24"`.

## The properties panel

Select a line in the sketch or in the line list to edit it by fields: its **Position** on the axis it crosses, and along its run Left, Right, and Length for a horizontal line or Bottom, Top, and Length for a vertical one. Two of the three run values are driven; the third is marked derived and shows its computed value. Each field accepts a length or an expression, and a **Construction** checkbox turns the line into a guide.

The sketch properties list the shapes the lines enclose, a rectangle by its name, `r1 24" x 16"`, and anything else as **Region**, each with the lines that bound it; selecting one there selects it in the view and the reverse. The lines themselves are in a collapsed list below.

## The rectangle form

Click inside a rectangle, choose its row in the shape list, or select any of its sides, and its form appears: Left, Right, Bottom, Top, Width, Height, and Explode. A side field is that line's position, so typing Left moves the left line and changes the width. Width moves the right line to the left line plus what you typed, and Height moves the top; both accept expressions, so a Width of `ply * 2` becomes `l1.at + (ply * 2)` on the right line. If the far line is already held by an expression the edit is refused and the message names it.

Blank is not allowed: every field has a value. To make a line follow something instead of holding a number, type an expression or use the Link tool.
