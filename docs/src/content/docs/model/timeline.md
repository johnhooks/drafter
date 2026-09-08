---
title: Timeline
description: Features evaluate in order, edits re-evaluate everything after them, and deletions cascade.
sidebar:
  order: 3
---

The timeline on the left lists every feature in the order it was added: sketches and extrudes. It is the whole document. Bodies are not stored; they are the result of running the timeline from the top.

## Evaluation

Every edit re-runs the timeline. A sketch resolves its plane and its rectangles from the model as it stands at that point, then an extrude applies its boxes. Changing an early feature therefore changes everything that references it, directly or through a face.

Sketches and extrudes get automatic names, Sketch 1, Extrude 1, and so on, which you can rename. Each sketch also has a handle such as `s1` that stays fixed when you rename it.

## Errors

A feature that cannot evaluate is marked in the timeline and listed under the view. Reasons include a sketch whose face has been cut away, an extrude whose target body does not exist yet, a rectangle whose expression fails, or a distance that is zero. The failed feature is skipped and features that depend on it fail with a message naming it. Everything independent still evaluates, so one mistake does not blank the model.

## Deleting

Deleting a feature deletes what depends on it: extrudes that use a sketch, sketches attached to a face of an extrude, and extrudes that target the body it created. The confirmation lists everything that will go, in order, before anything is removed.

## Reopening a sketch

Press **Edit** beside a sketch to reopen it. It shows the model as it was at that point in the timeline: later bodies and cuts are not there yet, which is exactly the reference geometry the sketch was drawn against.
