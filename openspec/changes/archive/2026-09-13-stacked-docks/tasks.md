## 1. Layout state and preferences

- [x] 1.1 Add a UI-only layout model and reducer for stable panel ids, movement, fold states, dock widths, and temporary fill; verify unit tests cover same-dock reorder, cross-dock move, cancellation, uniqueness, and restore without document changes.
- [x] 1.2 Implement measured height allocation, neighbor transfers, minimum limits, viewport clamping, and default reset; verify unit tests cover all-folded panels, mixed folds, short windows, shrink/restore, and no allocation change when content grows.
- [x] 1.3 Add versioned browser preference loading and saving in the UI persistence layer; verify tests cover reload, invalid/duplicate ids, non-finite values, unavailable storage, legacy pane-height fallback, and exclusion of temporary fill and document selection.

## 2. Dock interactions and presentation

- [x] 2.1 Build reusable dock frames, control strips, inner headers, and scroll bodies using kit tokens; verify Storybook shows single thin canvas boundaries and no tab groups or duplicated top-navigation controls in both themes.
- [x] 2.2 Wire React Aria panel dragging to named insertion targets; verify pointer and keyboard moves within and between docks, Escape cancellation, announcements, focus restoration, and independence from modelling shortcuts.
- [x] 2.3 Implement horizontal panel and vertical dock separators with pointer capture, keyboard steps, and cancellation cleanup; verify browser tests for bounded resizing, double-click allocation reset, stable headers, and a usable central viewport.
- [x] 2.4 Implement individual folding, collapsed icon rails, and temporary fill/restore using distinct identity icons and matching corner action icons; verify one-click access to a previously folded panel, moved-panel rail order, and restoration of saved sizes/fold states from the same inner-header control.

## 3. Application integration and inspection

- [x] 3.1 Replace App/PropertiesColumn fixed sidebar composition with the panel registry and dock shell; verify Model, context Properties, Sketch entities, and Selection appear in their default positions and retain user placement across context changes.
- [x] 3.2 Extract actual line and rectangle form bodies from object disclosures and add explicit parent navigation; update affected lines/rectangles Playwright assertions and verify typed positions, derived fields, expression errors, construction, deletion, grouping, and Explode remain functional.
- [x] 3.3 Add constraint inspector precedence and target-line navigation using existing slot editing/removal actions; verify selecting a constraint over retained geometry shows its expression/result/error, editing and removal work, and returning to its line clears constraint selection.
- [x] 3.4 Preserve document parameters, extrude settings, sheet list, sheet settings, and annotation editing through contextual panel content; verify model/sketch/sheet transitions, absent panel restoration, and no changes to document files or undo history from layout actions.
- [x] 3.5 Connect actual viewport measurements to existing fit and pointer mapping; verify model and sketch fit/picking after dock resize/collapse, sheet interaction after resize, and no automatic fit from panel movement.

## 4. Documentation and integration verification

- [x] 4.1 Update user workspace guidance and `docs/src/content/docs/sketch/dimensions.md` for dock movement, icon rails, resizing, restore, and direct parent/constraint inspection; verify `pnpm docs:build` and that guidance describes current behavior without prototype history.
- [x] 4.2 Replace scratchpad-only coverage with maintained Storybook examples exercising real dock primitives; verify `pnpm kit:build`, `pnpm kit:test`, and kit typecheck, and visually review both themes with short viewports, long lists, all panels in one dock, and all panels folded.
- [x] 4.3 Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and `pnpm test:e2e`; verify updated layout tests cover persistence, focus, hidden inspector selection updates, fill restoration, and cross-mode regressions before marking implementation complete.
