---
title: Dimensions and Editing
description: Reading and typing sizes on the sketch and in the properties panel.
sidebar:
  order: 2
---

Every rectangle shows its width under its bottom edge and its height beside its right edge, in blue. Both can be moved: with the Select tool, drag the label along its edge to slide it, or drag it away from the edge to push it further out or to the other side. A short press without moving opens it for editing.

## Type a size on the sketch

Click a width or height label. An input opens with the current value. Type a new one and press Enter, or click away to commit. Escape cancels. A value that does not parse keeps the input open and shows why.

Typing a width keeps the rectangle's left edge and moves the right; typing a height keeps the bottom. That is the general rule for every edit; see [Driven slots](/constraints/driven-slots/).

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

Select a rectangle in the sketch or in the rectangle list to edit it by fields: Left, Right, Width, Bottom, Top, Height. Two of the three on each axis are driven; the third is marked derived and shows its computed value. Each field accepts a length or an expression.

Blank is not allowed: every field has a value. To make a rectangle follow something instead of holding a number, type an expression or use the Link tool.
