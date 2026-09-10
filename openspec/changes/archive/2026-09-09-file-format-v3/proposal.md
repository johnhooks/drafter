## Why

The file is only the model: parameters and features. How the user was looking at it, the camera and the sketch being edited, lives in mounted components and is lost on every reload and every switch between the model view and a sketch. Established modelling software keeps model and view state as two parts of one file, with only the model on the undo stack. Adopting that split now makes remembered views possible and keeps undo honest.

## What Changes

- The saved file becomes `{ version: 3, model, view }`. `model` is today's document body: title, params, features. `view` is display state: the camera (orbit angles, zoom, centre) and the id of the sketch open for editing, if any.
- Undo and redo snapshot `model` only. Changing the view never creates an undo entry.
- Autosave writes both parts on every change to either. Loading restores the camera and reopens the sketch that was open.
- Downloaded files carry the view, so a file opens where its author left it; a file without a `view` opens at the default view in the model mode.
- Version 1 and 2 files load and are rewritten as version 3.
- Theme and dimension visibility stay browser preferences, not file content.

Before the first release, versions 1 to 3 collapse into a single version 1 and the migrations are deleted; nothing has shipped, so only development files exist. That collapse is a separate change to be made at release time and is recorded here so it is not forgotten.

Not in this change: orbiting the camera (the next change, `orbit-view`, which uses the `view` slot), named saved views, panel layout in the file.

## Capabilities

### New Capabilities
- `document-file`: the file structure, which part undo covers, what view state holds, and how loading restores it.

### Modified Capabilities
- `persistence-export`: autosave, download, and open carry the view part; the corrupt and round-trip scenarios include it.

## Impact

- Core: `Document` becomes the `model`; a `DocumentFile` type wraps it with `view`; parse and serialize handle version 3 and migrate 1 and 2.
- Store: state holds `model` and `view` separately; `withDoc` pushes history for the model only; a `setView` action; load and initial state restore both.
- UI: the 3D view reads and writes the camera from the store; the app reopens the stored sketch on load.
- Tests: the debug hook and end-to-end helpers rename `doc` to `model`.
- Ordering: `sketch-extrude-modeler` must be archived before this change is archived, because it modifies `persistence-export`.
