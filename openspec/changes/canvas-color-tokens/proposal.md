## Why

The kit gives the panels one semantic palette with light and dark themes and a test that refuses a literal colour. The sketch canvas has none of that: every stroke and fill in the sketch view is a hex literal in one component, twenty of them, and the canvas stays light grey when the panels go dark. The constraint display just added an anchor violet the same way, and drawing sheets are about to add a third set. Giving the canvas its own tokens now puts every colour the user sees in one place, makes the dark theme whole, and lets sheets start from the palette instead of adding to the pile.

## What Changes

- The kit gains canvas tokens, `--kit-canvas-*`, named for their role: surface, grid axis, major and minor grid, geometry line, construction line, handle text, selection, hover, region fill and its hover and selected fills, constraint, anchor, link highlight, error, reference face fill and edge, and body outline. Light values are the colours the canvas draws today; dark values are new.
- The sketch view reads the canvas tokens once per theme and draws with the resolved values, so the canvas follows the theme setting like the panels do. Colour names disappear from `SketchEditor.tsx`.
- The kit's theme test covers the canvas tokens, so a theme that misses one fails.
- The exported sketch SVG keeps its resolved colours and gains a background in the canvas surface colour, so a file exported from the dark theme reads as it did on screen and still depends on no app stylesheet.
- The inline edit error message in the sketch uses the kit's danger and surface tokens through a class instead of inline literals.

Not in this change: the 3D model view's colours, the view cube, the sheet editor, or any change to which colour means what.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `app-theme`: the theme restyles the sketch view as well as the panels.
- `persistence-export`: the sketch SVG carries the theme's colours and a background.

## Impact

- Kit: `tokens.css` and both theme files gain the canvas tokens; `test/tokens.test.ts` recognises them as colour tokens.
- UI: a `palette.ts` in `src/ui/sketch` that lists the canvas tokens and reads them from computed style; `SketchEditor` takes its colours from the palette; `styles.css` loses the canvas background literal and gains the error message class.
- Tests: a unit test that the palette reader names every `--kit-canvas-*` token the kit defines and nothing else; an e2e step that switching to dark changes the canvas background and a line's stroke, and that the export from the dark theme has a background rect.
- Docs: the ui-kit page's tokens section and the theme section of run-it.
- Ordering: `sketch-constraint-display` adds the anchor colour to the editor and must be archived before this change.
