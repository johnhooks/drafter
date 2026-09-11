## Context

`dimensionsOf` in `src/ui/sketch/Dimensions.tsx` turns every expression slot into a `DimSpec` (a simple link with a resolvable anchor) or a `TagSpec` (anything else), skipping attachments. `SketchEditor` calls it only when `display.dims` is on, so the toggle is all or nothing and hover and selection play no part. The anchor lookup knows `face` and line handles; a rectangle handle resolves to nothing and the slot falls through to a tag. Handles and sizes already follow an on-demand rule (`showHandle`, `showLabel`) keyed on hover, selection, and their toggle. Lines are drawn near-black, construction grey, hover and selection blue, failure red; constraints amber. Nothing in the sketch is dragged except handles, labels, and placements. See proposal.md.

## Goals / Non-Goals

**Goals:**
- One gate per constraint, `showConstraint(ref)`, in the same shape as `showHandle` and `showLabel`, so the three kinds obey one rule.
- A resting cue that costs nothing to compute and adds no state.

**Non-Goals:**
- A solver or any notion of a line being under- or fully constrained; every slot always has a value.
- Colouring whole lines by literal versus expression.
- Changing how constraints are placed, dragged, edited, or deleted.

## Decisions

**Compute every constraint, gate at draw time.** `dimensionsOf` runs whenever the sketch has a result, not only when the toggle is on, and `SketchEditor` filters its output through `showConstraint`. Alternative: pass hover and selection into `dimensionsOf`. Rejected: automatic stacking must see every constraint on an axis or a hovered constraint would jump to a different stack position than it has with the toggle on; placement must be stable across the two ways of becoming visible.

**The gate.** A constraint is shown when the toggle is on, when its line is hovered or selected, or when it is the selected constraint. Highlight (the existing selected style, widened) applies to the selected constraint and, with the toggle on, to constraints of the hovered or selected line. This is the `showHandle` rule with the constraint list's selection added, which the spec already requires to highlight.

**Ticks come from the same pass.** `dimensionsOf` returns a third list, `ticks`, one per expression slot that is not an attachment and not on a failed line, with the line id, slot, and the tick's plane coordinate: the run midpoint for `at`, the end for `min` and `max`. `SketchEditor` draws a tick only when `showConstraint` is false for that slot, so a tick and its constraint never appear together. A `size` slot ticks at the midpoint like `at`. Alternative: derive ticks in the editor from `sketch.lines`. Rejected: the attachment and failure tests already live in `dimensionsOf`; a second copy would drift.

**Tick geometry.** 6 px long, 1.5 px wide, amber, centred on the line and perpendicular to it, in screen pixels like `DRIVING_OFFSET_PX`. It does not take pointer events; the line under it does.

**Anchor highlight.** Each drawn constraint carries the edges it measures from, resolved in the same pass as its coordinate: the anchor line, a face side, a rectangle side's member line, or both lines around a middle. The editor overlays a wide translucent violet stroke on each edge whenever the constraint is shown for a reason other than the toggle. This is the same predicate as on-demand display, so hover, selection, and the list all light the pair, and the toggle alone keeps the canvas quiet. Violet is used by nothing else in the sketch: the link tool's highlight is orange, selection blue, constraints amber, so an anchor is recognisable on colour alone and does not change when its constraint is emphasised.

**Rectangle anchors.** `anchorCoord` gains a branch for a handle that names a rectangle: `left`, `right`, `bottom`, `top` resolve to the member line's `at`; `umid` and `vmid` to the mean of the two members. The mapping comes from `rectPropAsLines` in `src/core/model/sketch.ts` so the drawing agrees with evaluation, which is the same single-definition fix the review asked for on the evaluator side. `anchorName` keeps the text the user typed.

**Preference rename.** `Display.dims` becomes `Display.constraints`. `loadDisplay` reads a stored `dims` boolean when `constraints` is absent, so nobody's toggle flips on upgrade. The toolbar toggle's label is "Constraints"; the icon stays the ruler unless the kit has a better fit.

**Naming in code.** `DimSpec`, `dimKey`, `DimTarget`, and `DimLayout` stay. They serve size labels too, they name a measured-line drawing rather than a concept, and a mass rename would obscure the diff for no behaviour. The user-facing words change: toggle, tooltips, spec, docs.

## Risks / Trade-offs

- [A hovered constraint appears and disappears as the pointer crosses the line, flashing on a busy sketch] → The editor already keeps labels for a hovered bounding line's regions with a grace period; constraints of the hovered line use the same hover state, so they inherit the grace.
- [A tick on a short line is hard to distinguish from the line's own end cap] → The tick is perpendicular and amber; the cap is square and the line's colour. If it still reads badly the tick can move a few pixels in from the end without changing the spec.
- [Old e2e steps click the "Dimensions" toggle by name] → They change to "Constraints" in the same change; the debug state key changes from `dims` to `constraints`.
