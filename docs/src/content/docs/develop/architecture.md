---
title: Architecture
description: A pure core, a thin React shell, and the one property everything depends on.
sidebar:
  order: 1
---

The code splits into a core with no user interface dependency and a user interface on top.

## Core

`src/core` is plain TypeScript. It holds units, geometry, the document model, expressions, and evaluation, and a test fails if anything in it imports React, three.js, zustand, or touches the DOM.

- **Units.** Lengths are integers in sixteenths of an inch. Parsing and formatting live in one place.
- **Geometry.** A body is a set of disjoint axis-aligned boxes. Join and cut are box subtraction, exact by construction. Faces are derived from the boxes: each box face minus the faces of touching boxes, merged into connected regions with outlines.
- **Model.** The document is a list of features. Planes map (u, v) to model coordinates. Rectangles are two driven slots per axis.
- **Expressions.** A tokenizer, a parser to a small tree, and an evaluator over an explicit scope of parameters, rectangles, and the face. Values are lengths or axis-tagged positions.
- **Evaluation.** One pure function runs the timeline and returns bodies plus a result or error per feature. Every edit re-runs it.

Everything relies on geometry being axis-aligned. That is a deliberate constraint, not an accident.

## User interface

`src/ui` is React. A zustand store holds the document, its evaluation, the mode, selection, and notices. Every action is a pure function from state to state, tested without React. The sketch editor is SVG with tools implemented as small state machines that share a preview path with committed geometry. The 3D view is react-three-fiber with an orthographic camera at a fixed isometric angle; face picking maps a hit point back to the extrude and face that own it.

## Documentation

`docs/` is an Astro site with Starlight. Pages describe current behaviour. When behaviour changes, the page changes in the same commit.
