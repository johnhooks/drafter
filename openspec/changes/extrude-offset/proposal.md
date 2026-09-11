## Why

An extrude always starts on its sketch plane. A pocket that begins below a face, a shelf that stands off a side, or a slot that stops short of a face all need a second sketch on a plane at the right depth, which is a plane the user has to work out and keep in step with the extrude. A start offset on the extrude lets the sketch stay where it is and the extrude say where it begins.

## What Changes

- An extrude gains an **offset**: a signed length, expression-capable, measured from the sketch plane along its normal. The extrusion starts on the plane at that offset and runs its distance from there. Zero is the current behaviour and the default; the field may be absent in a file.
- The properties panel shows an Offset field beside Distance and Direction, with its resolved value and any expression error.
- Faces of an offset extrude (cap, base, sides) sit where the offset geometry puts them, so sketches on those faces, face references in expressions, and picking in the view follow the offset.
- The extrude page and the file format page describe the field.

Not in this change: a "from object" start, two-sided or symmetric extrusion, or any change to how distance and direction are entered.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `extrude`: the inputs gain a signed offset; boxes span from the offset plane rather than the sketch plane.
- `sketch-planes`: a face reference into an offset extrusion resolves to the face the offset geometry actually has.

## Impact

- Core: `ExtrudeFeature` gains an optional `offset: Len`; `evaluate` resolves it against parameters and shifts the resolved plane before `applyExtrude`; the extrude result records the shifted plane so `capPlane`, `sideBox`, face resolution, and picking need no change; `validate` checks the field when present.
- UI: `Properties.tsx` gains an Offset `LenField` on the extrude panel; `updateExtrude` already accepts the patch.
- File: version 5 files gain an optional `offset` key on extrudes; no version bump and no migration, absent means zero.
- Tests: core evaluate and pick tests for box bounds, a base-face sketch on an offset extrude, and expression errors; a UI action test; an e2e step setting the offset from the panel.
- Docs: `model/extrude-and-bodies.md` and `files/format.md`.
