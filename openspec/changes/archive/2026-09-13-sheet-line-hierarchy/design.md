## Context

See proposal.md for motivation. `src/core/sheets/render.ts` gives all projected edges a 0.01-inch stroke; `annotations.ts` uses the same width. The annotation renderer already computes paper coordinates and a 1/16-inch extension overrun, but starts extensions on the measured points. Preview, export, and print share the pure SVG renderer. Existing core tests assert exact extension endpoints.

## Goals / Non-Goals

**Goals:** Centralize the two physical stroke weights and distinguish extensions from geometry without altering model units, annotation coordinates, or picking behavior.

**Non-Goals:** Configurable drafting standards, new colour schemes, arrowheads replacing ticks, text resizing, automatic dimension placement, raster edge thickening, and sketch styling.

## Decisions

### Use shared paper-space constants

Define visible-edge and thin-stroke widths in a small pure sheet presentation module, converting 0.50 and 0.25 mm to inches with division by 25.4. Both renderers consume them. These are derived presentation lengths, not model lengths; do not round to sixteenths. Keep border and title-block styles unchanged. Inline literal SVG attributes preserve standalone output; CSS-only styling would require duplicating export handling.

Assign visible and hidden segment widths according to visibility, keeping the existing dash pattern. Use the thin width for the annotation group so ticks and leaders follow it while text remains unstroked. Colour remains independent of width; existing selection and warning treatment continues.

### Offset extensions after projection

Choose 1/16 inch as the proposed fixed paper gap, close to the discussed drafting convention and consistent with the existing overrun. Keep gap, overrun, and text spacing semantically separate even where their numeric values agree.

For each measured point, compare its paper coordinate on the extension axis with the dimension-line coordinate. If the absolute distance exceeds the gap, start one gap toward the line and finish one overrun beyond it. Otherwise omit that extension. Decide independently for both points, including points on opposite sides of the dimension line. This avoids reversed fragments near geometry rather than clamping the gap unpredictably. Dimension strokes, ticks, values, and stored coordinates remain unchanged. Note leaders retain their endpoint and receive no gap.

Evaluate the omission boundary using the stored integer coordinate difference against the paper gap converted to view units. Subtracting translated paper coordinates can round an exact 1/16-inch separation upward at 1:12 and incorrectly draw an extension. Apply the actual offsets in paper coordinates afterward.

### Reuse the shared output path

Do not add per-document style data or separate preview styles. Existing documents receive the presentation automatically. Verify effective widths in the browser and serialized SVG, not just the presence of a constant. Continue using visible painted annotation strokes and text for picking; the new extension gap intentionally is not a hit target.

## Risks / Trade-offs

- Heavier outlines can crowd small details: inspect representative sheets at fit-to-page and print size, including a pocket with hidden edges and a short dimension. Keep annotations thin instead of relying on grey that may print poorly.
- A dimension placed directly on geometry still overlaps it: omit degenerate extensions but do not add automatic repositioning. Placement remains the user's choice.
- Low zoom can soften the hierarchy through antialiasing: retain exact physical output widths rather than applying minimum screen-pixel widths that disagree with print.
- Isometric geometry remains rasterized with its existing edge treatment: only its SVG note leaders participate in this change.

## Migration Plan

No migration or dependencies. Apply renderer changes and documentation together. Reverting the presentation change restores the previous appearance without modifying saved documents.
