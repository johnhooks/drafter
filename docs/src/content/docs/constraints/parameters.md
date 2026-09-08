---
title: Parameters
description: Name a length once and use it in rectangles, extrude distances, and plane offsets.
sidebar:
  order: 3
---

A parameter is a named length on the document, such as `ply = 3/4`. Any field that accepts an expression can use it.

## Add and edit

Parameters live in the document properties. Click empty space in the 3D view so nothing is selected, then use the Parameters section: name, value, **Add**. Names start with a letter or underscore and contain only letters, digits, and underscores. `face` is reserved.

A value can be a length or an expression over parameters defined above it: `dado = ply / 2` works if `ply` comes first. Each row shows the evaluated value.

## Use

Type the name anywhere an expression is accepted: a rectangle slot (`ply * 2`), an extrude's distance (`ply`), or a principal plane's offset (`ply + 1/4`). Change the parameter and everything using it re-evaluates.

## Rename and delete

Renaming a parameter rewrites every expression that uses it. Deleting a parameter that is still in use is refused, and the message lists every place it is used so you can change those first.
