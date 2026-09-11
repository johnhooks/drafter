## Context

`evaluate` resolves an extrude's distance against the parameters and calls `applyExtrude` with the sketch's resolved plane; `boxFromRect` puts the near face of every box on `plane.offset` and the far face at `plane.offset + normal * distance`. The extrude result stores that plane and distance, and everything that needs a face of the extrusion reads them from the result: `capPlane` and `sideBox` in `src/core/model/planes.ts`, `resolveFaceRef` in `evaluate.ts`, and `findFaceRef` in `pick.ts`. The properties panel splits the stored distance into a magnitude and an along/against select, wrapping expressions as `-(expr)` for the against case. A principal sketch plane already has a signed `offset` slot edited through a plain `LenField`. See proposal.md.

## Goals / Non-Goals

**Goals:**
- One place computes where an extrusion starts; nothing downstream learns about the offset.
- The field reads the way a signed length does elsewhere in the app, with no sign wrapping for expressions.

**Non-Goals:**
- Two-sided or symmetric extrusion, or a start taken from another face.
- Changing how distance is stored or shown.
- A file format version bump.

## Decisions

**Offset is signed along the sketch plane normal, independent of the distance sign.** Start is `plane.offset + normal * offset`; the extrusion runs `distance` along the normal from there. This is how Fusion's Start > Offset works and it is what the user expects: cutting a pocket that begins 1/2" below a top face and goes 1/4" deeper is offset -1/2", distance 1/4" against. Alternative: measure the offset in the direction of travel so it flips with the direction select. Rejected: it would require a second direction control or an implicit flip of the offset when the direction changes, and it diverges from the convention users already know.

**Shift the resolved plane, store the shifted plane in the result.** `evaluate` resolves the offset like the distance, builds `start = { ...sr.plane, offset: sr.plane.offset + sr.plane.normal * offset }`, passes `start` to `applyExtrude`, and records `plane: start` in the extrude result. `capPlane`, `sideBox`, `resolveFaceRef`, and `findFaceRef` all take the plane from the result, so the base face lands on the offset plane, the cap at offset plus distance, sides span between them, and picking a face of an offset body resolves to the right reference with no change to those functions. Alternative: add an `offset` parameter to `boxFromRect`, `capPlane`, and `sideBox` and thread it through every caller. Rejected: four signatures and every test fixture change for what is a translation of the start plane.

**The sketch result keeps the unshifted plane.** The sketch's own plane, its lines in the 3D view, and `face` in its expressions stay on the sketch plane. Only the extrude result carries the shifted plane. A sketch that references a face of an offset extrude sees the shifted geometry through the extrude result, which is the intended behaviour.

**Error prefix.** An offset expression that fails produces `Offset: <message>`, matching the existing `Distance: <message>` prefix that the panel uses to attach the error to the right field.

**Optional field, no version bump.** `ExtrudeFeature.offset?: Len`; absent or zero means the current behaviour. `validate` runs `checkLen` on it with zero allowed when the key is present. The store writes the value the user commits, including 0, and `addExtrude` leaves the key absent. Alternative: bump to version 6 so an older build refuses the file rather than silently dropping the offset. Rejected: no older build is distributed, the app is the only reader of its files, and the migration chain would gain a step that changes nothing.

**Panel.** An `Offset` `LenField` after the Direction select, value `extrude.offset ?? 0`, error from the `Offset:` prefix. The extrude result records the resolved `offset` beside `distance` so the panel shows it without recomputing it from two planes. The hint reads: "From the sketch plane, positive along the normal. Negative starts into the face."

**Sketch editor.** The Extrude button creates extrudes with no offset, as today. The offset is set from the properties panel.

## Risks / Trade-offs

- [A join with an offset can leave a gap between the box and the target body, producing a body of two separate box sets] → Bodies are already defined as sets of disjoint boxes with no connectivity requirement, so this evaluates and renders correctly. No warning in this change; if it proves confusing a later change can flag a join that touches nothing.
- [A cut whose offset moves it entirely outside the target removes nothing] → Same as a cut that misses today; the extrude evaluates without error. Documented on the extrude page.
- [Existing tests assert the extrude result's `plane` equals the sketch's plane] → They hold when offset is absent. New tests assert the shifted plane only for offset extrudes.
