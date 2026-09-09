## Context

`Document` is `{ version: 2, title, params, features }` and is what the store snapshots for undo, what `withDoc` evaluates, and what persistence saves. The 3D camera lives in drei's `OrbitControls` inside the mounted component. The convention in established modelling tools is one file with a model part under undo and a display part outside it.

## Goals / Non-Goals

**Goals:**
- One file, two parts, one rule: undo is the model.
- Reload and shared files open where they were left, including the open sketch.
- The core evaluator and every existing model test untouched apart from the rename.

**Non-Goals:**
- Camera interaction beyond storing it (next change).
- Named views, panel layout, theme in the file.

## Decisions

**Types.** `Model = { title, params, features }` (today's document body without version). `ViewState = { camera: { azimuth: number; elevation: number; zoom: number; center: [Sixteenths, Sixteenths, Sixteenths] }; sketchId?: string }`. `DocumentFile = { version: 3; model: Model; view: ViewState }`. The name `Document` is kept as an alias of `Model` in core so `evaluate(doc)` and the tests read unchanged; the store and persistence use `model` and `view` explicitly.

**Default view.** The current fixed camera expressed in the new fields: azimuth and elevation of the front-left isometric, zoom 6, centre at the origin. A single `DEFAULT_VIEW` constant; the next change only reads and writes it.

**Store.** `State.doc` becomes `State.model`; `State.view` is added. `withDoc` keeps its role for the model and history. `setView(partial)` merges into `view` with no history push. `loadFile(file)` sets both and, when `view.sketchId` resolves to a sketch, sets mode to that sketch; the reconcile step already used by undo drops a stale id. The debug hook exposes `model` and `view`.

**Persistence.** One storage key holds the whole file. The subscriber saves on a change to model or view; camera drags are throttled to one save per 250 ms so orbiting does not write on every frame. Version 1 and 2 readers wrap the old body as `model` and add `DEFAULT_VIEW`.

**3D view binding.** The camera component reads `view.camera` from the store to position itself on mount and after load; user changes flow back through `setView`. In this change nothing changes the camera interactively except zoom and pan, which already exist and now persist.

**Release collapse.** Recorded in the proposal: at release time, replace the version 1 and 2 readers with a single version 1 format equal to today's version 3 shape, and delete the migration tests. Keeping them until then costs nothing and keeps the recovered development file opening.

## Risks / Trade-offs

- [A rename this wide breaks tests in bulk] → Keep `Document` as an alias in core; rename only in the store, persistence, and end-to-end helpers where the split is real.
- [Saving on camera movement wears storage] → Throttle; localStorage writes of a few kilobytes at 4 Hz are harmless.
- [Reopening a sketch on load surprises someone who expected the model view] → It is what they were looking at when they left; Finish is one click, and it matches how Blender and SketchUp behave.
