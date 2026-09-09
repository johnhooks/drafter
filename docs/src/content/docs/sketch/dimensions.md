---
title: Dimensions and Editing
description: Reading and typing sizes on the sketch and in the properties panel.
sidebar:
  order: 2
---

Every region shows its width under its bottom edge and its height beside its right edge, in blue. A line that bounds no region shows its length beside it instead. Labels can be moved: with the Select tool, drag one along its edge to slide it, or away from the edge to push it further out or to the other side. A short press without moving opens it for editing.

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

The sketch properties list the shapes the lines enclose, a rectangle as **Rectangle** with its size and anything else as **Region**, each with the lines that bound it; selecting one there selects it in the view and the reverse. The lines themselves are in a collapsed list below.

Blank is not allowed: every field has a value. To make a line follow something instead of holding a number, type an expression or use the Link tool.
