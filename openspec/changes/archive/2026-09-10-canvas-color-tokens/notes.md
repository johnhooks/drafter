# Notes

## Verification

- `pnpm typecheck`, `pnpm build`, `pnpm docs:build`: clean.
- `pnpm test`: 281 tests, 28 files. New `tests/ui/palette.test.ts`: the palette's role list equals the set of `--kit-canvas-*` tokens in the kit's `tokens.css`.
- `pnpm kit:test`: 28. The theme test classifies colour tokens by their root value rather than an allowlist of names, so the canvas tokens are covered and a future colour token cannot slip past it; removing one from `dark.css` was confirmed to fail it. `pnpm kit:build` renders every story.
- `pnpm test:e2e`: 27 tests. New step in `theme.spec.ts`: with a sketch open, choosing dark changes the svg background and a line's stroke, the stroke equals the dark `--kit-canvas-line` value, an export from the dark theme has a rect in the dark surface colour as its first rect whose x, y, width, and height equal the viewBox, and the dark line colour on its lines with no `var()` reference, and choosing light restores the light values. Every earlier test passes unchanged against the palette-driven editor.

## Decisions made during implementation

- The palette reads from the root element rather than the svg, since the tokens cascade from `:root`, and re-reads on a `MutationObserver` of the root's `data-theme` attribute rather than on the store's theme. The app stamps the attribute in an effect that runs after the sketch's own, so a hook keyed on the store read the outgoing theme's colours on the first try.
- The surface is drawn as the svg's first child rect spanning the viewBox rather than styled on the element, so the export is a plain clone. A first version injected a rect into the clone with no x and y, which painted only the quadrant below and right of the centred origin; the e2e now checks the rect's geometry against the viewBox.
- On a reload into the dark theme the canvas draws its first frame light and re-renders dark one render after the panels, because the page starts light and the theme is stamped in a post-mount effect. Recorded in the design as a follow-up.
- The dark values were set by the design's intent and not tuned by eye; they are one file, `packages/kit/src/themes/dark.css`.
