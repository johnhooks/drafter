## Context

`sheet-views` gives sheets, projection with vertex and segment lists, `renderSheet` in paper inches, a sheet mode with a page view that converts pointer to paper inches, and sheet commands in the command table. The sketch editor has an ordered snapper list, `snap(u, v, ctx)` with a candidate context, and tools as small state machines on the `Tool` interface with previews drawn by the same code as committed geometry. See proposal.md.

## Goals / Non-Goals

**Goals:**
- Annotations that print at true scale and do not depend on screen size.
- Reuse of the snapper and tool infrastructure rather than a second copy.

**Non-Goals:**
- Associative dimensions that track model edges through edits; detachment detection is the substitute.
- Anything specific to the isometric view.

## Decisions

**Geometry-related points are view coordinates; free text is paper coordinates.** Dimension points and leader endpoints are view sixteenths so they stay on the geometry when the scale changes. Note text position is paper inches so notes stay where they were put on the page. The pointer-to-inches conversion goes through paper then view space, so both kinds share one path.

**Snapping reuses the sketch's snapper list with a projection source.** `SnapContext` gains a candidate source: the sketch supplies its lines, the sheet supplies the projection's vertices and segments. The corner, edge, and grid snappers are unchanged. Alternative: a second snap function for sheets. Rejected: the priority rule is the product's, not the sketch's.

**Tools are the sketch's `Tool` interface.** Dimension placement is a three-state tool with the orientation decided by the third pointer position; the note tool is two states; select is shared with drag of a dimension line or a note. Previews are drawn by `renderSheet`'s own annotation code from a preview annotation, as sketch previews are.

**Detachment is checked after every model change.** Each dimension point is tested against the projection's vertex list and segments; O(points x segments) is fine at this scale. Detection tests vertices and segments rather than raw box corners, so geometry merged by the projection still matches.

**Rendering.** `renderSheet` gains an annotations pass after the view group: extension lines, ticks, text with outside placement when the span is narrower than the text width estimated from the character count, leaders with an arrowhead marker. Detached dimensions use a warning colour, the one exception to black on white.

**Picking and placement feedback.** Annotation hit-testing follows painted strokes and text rather than group bounding boxes, so nested dimensions remain individually selectable. The dimension tool exposes only confirmed points. A screen-only, pointer-transparent overlay highlights projected segments containing those points and draws point markers in `--kit-canvas-select`; it clears with the tool state and never enters `renderSheet` or output.

**Persistence.** `Sheet` gains `dimensions` and `notes` arrays; the version stays 6 since both are optional and absent means none.

## Risks / Trade-offs

- [Detachment flags a dimension that is still correct, such as a point on a segment that merged] → Detection uses the merged vertices and segments, not raw box corners.
- [Text width estimated rather than measured] → Paper text at a fixed size with a character-count estimate is within a tick's width; the same estimate serves the sketch's labels today.
