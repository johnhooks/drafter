---
title: What It Is
description: A parametric modeller built from three ideas, sketches, extrudes, and a timeline, with exact fractional-inch geometry.
sidebar:
  order: 1
---

Drawing builds solid models from lines. You sketch horizontal and vertical lines on a plane, and wherever they close an outline they enclose a region. Extrude a region into a solid, then sketch on any face of that solid and extrude again to add or remove material. Every feature is recorded in a timeline, and editing an early feature re-evaluates everything after it, so a model keeps its intent when a dimension changes.

Three things set it apart from a drawing program:

- **Exact lengths.** Every length is a whole number of sixteenths of an inch. Sums and differences are exact; there is no floating point drift and no rounding surprise.
- **Real solids.** Cutting removes material. A pocket has a floor and walls; a through hole shows through.
- **Relations.** A line can be placed relative to another line, a face edge, or a named parameter. Change the parameter and everything built on it follows.

The model is axis-aligned throughout: sketch planes are the three principal planes or faces of bodies, and extrudes run along a plane's normal. That is what makes the geometry exact and the tool small.

## What it is not

There are no curves, angled planes, fillets, or assemblies. The 3D view is orthographic only; there is no perspective. If you need any of those, this is the wrong tool.

## Where things live

Your document autosaves in the browser you are using. Download it as JSON to keep a copy or move it to another machine. Sketches export as SVG and the 3D view as PNG.
