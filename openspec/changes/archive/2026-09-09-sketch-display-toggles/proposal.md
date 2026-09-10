## Why

A sketch labels everything it can as soon as it exists: a handle on every line, a width and height on every region, a length on every free line. A single rectangle carries six labels, and a divided outline carries dozens, most of which nobody is reading. Established sketchers label nothing the user did not ask about and surface names at the moment they are needed. Doing the same keeps the canvas legible as sketches grow, and the toggles that bring everything back belong in the toolbar where the tools are.

## What Changes

- By default a sketch shows only its geometry: lines, region fills, reference geometry, and the driving dimensions the user created. No handles, no size labels.
- Size labels appear for the hovered region or free line and for every selected one, in the same place and with the same editing and dragging as today.
- Line handles appear on the hovered line, on selected lines, and on every line while a field that accepts an expression has focus, so the name you need to type is on the canvas while you type it.
- A cluster of icon toggles at the right of the sketch toolbar shows everything at once per kind: grid, driving dimensions (replacing the text **Dims** toggle), handles, sizes. Each is on or off, has a tooltip, and is remembered as a browser preference like the theme.
- The live width and height while drawing are unchanged.

Not in this change: hiding reference geometry, a snap toggle, per-document display state, or changes to how dimensions are placed.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sketch-editor`: the view's default content, when size labels and handles are shown, and the display toggles.

## Impact

- UI: `SketchEditor` label rendering and hover state; `App` toolbar; a store `display` preference with persistence beside the theme; the kit gains an icon toggle button, or `ToggleButton` learns to hold an icon, with a story and test.
- Tests: e2e steps for the default view, hover and selection labelling, focus handles, and the toggles; the placement and constraints specs that click labels must select or hover first.
- Docs: tools-and-snapping and dimensions pages.
- Ordering: `sketch-lines-and-regions` modifies `sketch-editor` and must be archived before this change.
