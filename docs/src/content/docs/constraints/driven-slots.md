---
title: Driven Slots
description: Each axis of a rectangle is defined by two values; the third is derived. Which two, and what happens when you edit the third.
sidebar:
  order: 1
---

A rectangle has three quantities on each axis: **min**, **max**, and **size**. For the u axis those are Left, Right, and Width; for v, Bottom, Top, and Height. Any two determine the third, so exactly two are stored, the driven slots, and the third is derived and shown greyed in the properties panel.

A rectangle you draw stores min and max as numbers. A driven slot can also hold an [expression](/constraints/expressions/), which is what makes a rectangle follow something else.

## Editing a slot

Typing into any field, driven or derived, makes that slot driven with the value you typed. If that would leave three driven slots, one has to go.

:::note[The keep rule]
The edited slot is kept. Of the other two, an expression is always kept over a plain number. If both are plain numbers, the first of **min, size, max** in that order is kept and the other becomes derived.
:::

In practice:

- Type a **width** and the left edge stays where it is; the right edge moves.
- Type a **left** edge and the rectangle moves as a whole; its width is kept.
- Type a **right** edge and the width changes; the left edge stays.

If both other slots are expressions, the edit is refused with a message naming them, because satisfying it would mean silently dropping a relation. Remove one of the relations first.

## Failed rectangles

A rectangle whose expression cannot evaluate is drawn red and dashed at its last good position, listed with its error in the sketch properties and under the view, and any extrude that uses it fails with a message naming it. Fix the expression or replace it with a number.
