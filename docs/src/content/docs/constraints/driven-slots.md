---
title: Driven Slots
description: A line has a position and a run; the run is defined by two values and the third is derived. Which two, and what happens when you edit the third.
sidebar:
  order: 1
---

A line has a **position** on the axis it crosses, called `at`, and three quantities along the axis it runs on: **min**, **max**, and **size**. For a horizontal line those are Left, Right, and Length; for a vertical one Bottom, Top, and Length. Any two determine the third, so exactly two are stored, the driven slots, and the third is derived and shown greyed in the properties panel.

The position is one value and is simply replaced when you edit it. A line you draw stores its position as a number and its ends as numbers, except where an end lands on a perpendicular line: that end is stored as a reference to the other line's position, such as `l2.at`, so the corner holds when either line moves. Any slot can hold an [expression](/constraints/expressions/), which is what makes a line follow something else.

## Editing a run slot

Typing into any run field, driven or derived, makes that slot driven with the value you typed. If that would leave three driven slots, one has to go.

:::note[The keep rule]
The edited slot is kept. Of the other two, an expression is always kept over a plain number. If both are plain numbers, the first of **min, size, max** in that order is kept and the other becomes derived.
:::

In practice:

- Type a **length** and the first end stays where it is; the other end moves.
- Type a **left** or **bottom** end and the line moves as a whole; its length is kept.
- Type a **right** or **top** end and the length changes; the first end stays.

If both other slots are expressions, the edit is refused with a message naming them, because satisfying it would mean silently dropping a relation. This is the case for every side of a rectangle, whose ends are both attached: to change its length, move the perpendicular line at one end, or type Width or Height in the rectangle's form or on its label, which does that for you.

## Deleting a line

Deleting a line freezes every slot that referenced it to its current number first, so the rest of the sketch keeps its shape. Deleting one side of a rectangle leaves three plain lines and no region, and the rectangle's name goes with it; anything that referenced `r1` is rewritten over its lines first. An extrude that loses its only region is deleted with everything that depended on it, after confirmation.

## Failed lines

A line whose expression cannot evaluate is drawn red and dashed at its last good position, listed with its error in the sketch properties and under the view, and bounds no region. Lines attached to it fail with it, and any extrude whose region depends on them fails with a message naming the line. Fix the expression or replace it with a number.
