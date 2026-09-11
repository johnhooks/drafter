---
title: Expression Reference
description: The grammar, the names you can reference, and the rules about positions and lengths.
sidebar:
  order: 4
---

An expression is a small formula that yields a length or a position. It can go in any line slot, in an extrude's distance, in a plane offset, or in a parameter's value.

## Grammar

- **Literals** in inches: `24`, `2 1/4`, `2-1/4`, `3/4`, `2.5`. A trailing `"` is allowed. Decimals round to the nearest sixteenth.
- **Operators** `+`, `-`, `*`, `/`, unary minus, and parentheses, with the usual precedence.
- **Names**: `ply`, `l1.at`, `l2.right`, `r1.width`, `face.width`.

Results are rounded to a whole sixteenth. Division by zero is an error.

## Names

| Name | Meaning |
| --- | --- |
| `ply` | a document parameter |
| `l2.at` | the position of line `l2` in the same sketch: its v for a horizontal line, its u for a vertical one |
| `l2.left`, `l2.right`, `l2.mid` | the ends and middle of a horizontal line along u |
| `l2.bottom`, `l2.top`, `l2.mid` | the ends and middle of a vertical line along v |
| `l2.length` | its length |
| `r1.left`, `r1.right`, `r1.bottom`, `r1.top` | the positions of rectangle `r1`'s sides, read from its member lines |
| `r1.width`, `r1.height`, `r1.umid`, `r1.vmid` | its size and middles |
| `face.left`, `face.right`, `face.bottom`, `face.top`, `face.width`, `face.height`, `face.umid`, `face.vmid` | the bounding rectangle of the face this sketch sits on |

`face` exists only on a sketch attached to a face. Asking a vertical line for `left`, or a rectangle for `middle`, is an error that lists what it does have. Lines can reference any line in the same sketch, drawn earlier or later; the sketch resolves positions and runs separately, in dependency order, so the four sides of a rectangle may all reference each other's positions. Two positions cannot reference each other in a loop.

Extrude distances and plane offsets can use parameters and literals only.

## Positions and lengths

Edge and middle properties are **positions** on an axis. Sizes, parameters, and literals are **lengths**. The rules:

- position ± length is a position on the same axis
- position − position on the same axis is a length
- combining positions on different axes is an error
- a position cannot be multiplied, divided, or negated

A position slot takes a position on its own axis or a length; so do the end slots of a run. A length slot takes only a length. A horizontal line's `at` in a vertical line's position slot is an error that says so.

## Examples

Given a horizontal line `l1` at v = 30 from u 0 to 24, a vertical line `l2` at u = 24 from v 0 to 30, and a face from (0, -24) to (24, 0):

| Expression | Value |
| --- | --- |
| `face.left + 2 1/4` | position 2 1/4" |
| `face.right - 2` | position 22" |
| `(l1.length - 3/4) / 2` | 11 5/8" |
| `l1.right - l1.left` | 24" |
| `l1.length / 3` | 8" |
| `l2.at - l1.left` | 24" |
| `l2.top - face.left` | error: Z position with X position |
