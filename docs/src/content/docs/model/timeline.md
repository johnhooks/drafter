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

Deleting a feature deletes what depends on it: extrudes that use a sketch, sketches attached to a face of an extrude, and extrudes that target the body it created. Hover a row to reveal its delete button; the confirmation lists everything that will go before anything is removed.

## Undo

Every change to the document can be undone and redone, from the toolbar or with Cmd+Z and Cmd+Shift+Z (Ctrl on other systems). One gesture is one step: a drag, a committed field, a link, a delete with everything it cascaded to, a parameter rename with every expression it rewrote. Typing into a name coalesces into one step. What you are looking at does not change: selection, tool, pan, and zoom stay, except that undoing the creation of the sketch you are editing returns you to the model view. Opening or starting a document clears the history, which keeps the last 200 steps and is not saved.

## Reopening a sketch

Hover a sketch in the timeline and press its edit button to reopen it. It shows the model as it was at that point in the timeline: later bodies and cuts are not there yet, which is exactly the reference geometry the sketch was drawn against.
