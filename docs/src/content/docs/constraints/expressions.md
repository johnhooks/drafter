---
title: Expression Reference
description: The grammar, the names you can reference, and the rules about positions and lengths.
sidebar:
  order: 4
---

An expression is a small formula that yields a length or a position. It can go in any rectangle slot, in an extrude's distance, in a plane offset, or in a parameter's value.

## Grammar

- **Literals** in inches: `24`, `2 1/4`, `2-1/4`, `3/4`, `2.5`. A trailing `"` is allowed. Decimals round to the nearest sixteenth.
- **Operators** `+`, `-`, `*`, `/`, unary minus, and parentheses, with the usual precedence.
- **Names**: `ply`, `r1.right`, `face.width`.

Results are rounded to a whole sixteenth. Division by zero is an error.

## Names

| Name | Meaning |
| --- | --- |
| `ply` | a document parameter |
| `r2.left`, `r2.right`, `r2.umid` | the left edge, right edge, and horizontal middle of rectangle `r2` in the same sketch |
| `r2.bottom`, `r2.top`, `r2.vmid` | its bottom edge, top edge, and vertical middle |
| `r2.width`, `r2.height` | its size |
| `face.left` and so on | the same properties of the face this sketch sits on |

`face` exists only on a sketch attached to a face. Rectangles can reference any rectangle in the same sketch, drawn earlier or later; the sketch resolves them in dependency order. A rectangle cannot reference itself, and two rectangles cannot reference each other in a loop.

Extrude distances and plane offsets can use parameters and literals only.

## Positions and lengths

Edge and middle properties are **positions** on an axis. Sizes, parameters, and literals are **lengths**. The rules:

- position ± length is a position on the same axis
- position − position on the same axis is a length
- combining positions on different axes is an error
- a position cannot be multiplied, divided, or negated

Left and Right slots take a position on the plane's u axis or a length; Bottom and Top take a v position or a length; Width and Height take only a length. `r1.top` in a Left slot is an error that says so.

## Examples

Given `r1` from (0, 0) to (24, 30) and a face from (0, -24) to (24, 0):

| Expression | Value |
| --- | --- |
| `face.left + 2 1/4` | position 2 1/4" |
| `face.right - 2` | position 22" |
| `(r1.width - 3/4) / 2` | 11 5/8" |
| `r1.right - r1.left` | 24" |
| `r1.width / 3` | 8" |
| `r1.top - face.left` | error: Z position with X position |
