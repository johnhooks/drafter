## Context

`dimensionsOf` in `src/ui/sketch/Dimensions.tsx` derives every driving dimension from the resolved sketch and picks its line position from the rectangle edge; the editor adds a fixed 22 px. Size labels are placed in `rectNodes` at fixed spots. Label pointerdown opens an inline editor; dimension group pointerdown selects. All of it is stateless.

## Goals / Non-Goals

**Goals:**
- One placement record shared by driving dimensions and size labels.
- Drag that cannot be confused with click or edit.
- Defaults good enough that most dimensions are never dragged.

**Non-Goals:**
- Sheet dimensions (own placement in `drawing-sheets`), text overrides, leaders.

## Decisions

**Storage on the rectangle.** `SketchRect` gains `layout?: { u?: AxisLayout; v?: AxisLayout }` with `AxisLayout = { min?: DimLayout; max?: DimLayout; size?: DimLayout }` and `DimLayout = { offset: Sixteenths; label?: number }`. It sits beside the slots so removing a constraint (`removeConstraint`) or deleting a rectangle drops it naturally. Optional throughout, so version 2 files without it stay valid and no migration is needed. Alternative: a separate map on the sketch keyed by slot. Rejected: lifetime would have to be managed by hand.

**Offsets in sixteenths, labels as fractions.** Offsets scale with zoom and stay exact. The label fraction is dimensionless and survives changes to the dimension's length; clamped to [-0.5, 1.5] so a label can sit past an end for short dimensions. Automatic placement still uses pixel constants (22 px) so it looks the same at every zoom; a dragged offset converts pixels to sixteenths at the current scale on release.

**Sign convention.** The offset is a continuous coordinate from one reference edge: positive is away from the rectangle on the dimension's default side (above for u-axis driving dimensions, below for the width label, and so on), zero is on that edge, and negative runs through the rectangle and out the far side. Extension lines start from whichever edge is nearer the line. This lets a dimension sit inside the geometry it measures, which is ordinary drafting, and a drag across the rectangle needs no special handling.

**Automatic placement.** Driving dimensions move to the side opposite the size labels (above and left). Within one axis of one rectangle, driving dimensions without a placement stack outward in slot order (min, then max) by one step. Size labels keep today's spots.

**Drag as a select-tool state.** `SelectTool` gains `dragging: { kind: 'line' | 'label'; target; start; current } | null`. `down` on `[data-dim-slot]` or `[data-dim-label]` records a candidate; `move` past 3 px starts the drag and the editor renders from the live value; `up` commits through one store action `setDimLayout(sketchId, rectId, axis, slot, layout)` or, if never past the threshold, falls through to today's behaviour (select, or open the editor). Size labels get `data-dim-label` and a slot of `size`. The label editor opens on pointerup-without-move instead of pointerdown, which also removes the earlier `preventDefault` workaround.

**One undo entry.** Only the release dispatches; intermediate positions are component state.

**Rendering.** `dimensionsOf` returns `at` computed from the placement or the default, plus `labelAt`. Size labels go through the same placement lookup in `rectNodes`.

## Risks / Trade-offs

- [Pixel constants for defaults and sixteenths for placements disagree when zooming] → Only the automatic case uses pixels; once dragged, a dimension is in drawing units like everything else. Documented in the spec.
- [Drag threshold makes a very short intentional drag feel like a click] → 3 px is the usual threshold; no drag under it is visible anyway.
- [Label past the end overlaps another rectangle] → The user chose it; a drag fixes it. No automatic avoidance.
