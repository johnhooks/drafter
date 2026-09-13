## Why

Sheet object edges and dimension lines currently share the same stroke width, and extension lines start directly on geometry. A clear printed line hierarchy and a small extension-line gap will distinguish the model from its annotations without relying on colour.

## What Changes

- Draw orthographic visible edges at 0.50 mm and hidden dashed edges at 0.25 mm on paper.
- Draw dimension lines, ticks, extension lines, and note leaders at 0.25 mm. Keep normal output black and preserve selection and warning colours.
- Start dimension extension lines 1/16" from their measured points toward the dimension line, retaining the existing 1/16" overrun. Omit an extension when the dimension line is no farther than the gap from that point.
- Apply the same physical sizes in preview, SVG export, and printing, independent of model scale.
- Keep existing text sizes, ticks, dash patterns, page borders, and title blocks. No user settings or file-format changes. Isometric raster geometry and sketch rendering are unchanged; isometric note leaders use the thin annotation width.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `drawing-sheets`: Establish fixed paper widths for visible and hidden orthographic edges and consistent output.
- `sheet-annotations`: Establish thin annotation strokes and separated dimension extension lines.

## Impact

Changes are limited to the pure sheet renderers, their shared presentation constants, core and browser tests, and the drawing sheets guide. Existing documents acquire the new presentation without changing stored geometry, annotation coordinates, measurements, or scale. No new dependencies are needed.
