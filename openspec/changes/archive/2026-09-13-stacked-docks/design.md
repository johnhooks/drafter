## Context

See `proposal.md` for motivation. The accepted visual reference is `packages/kit/.storybook/app/StackedDocks.stories.tsx` including the icon rail and matching maximize/restore glyphs. That story now uses the maintained DockWorkspace examples and component stylesheet. Earlier tabbed stories are alternatives, not acceptance targets.

The app currently uses fixed grid widths in `src/ui/styles.css`; `PropertiesColumn.tsx` owns sketch settings, the list accordion, and a bottom Selection pane. `Properties.tsx` wraps line and rectangle forms in disclosures. `selectConstraint` preserves geometry selection, so inspector precedence must be explicit. `persist.ts` stores only `paneHeight` under `drafter.layout`. Existing Playwright coverage in `tests/e2e/lines.spec.ts` and `rectangles.spec.ts` asserts the old layout and parent form behavior.

This design is necessary because the change crosses application composition, interaction state, persistence, and selection presentation. It does not promote the scratchpad's hard-coded dimensions or mock editing rules to production behavior.

## Goals / Non-Goals

**Goals:** Reuse existing editing content inside independently managed panels, keep layout state separate from document state, and make allocation deterministic across resizing, folding, movement, and temporary fill.

**Non-Goals:** Free-floating windows, arbitrary nested docking, tab groups, pinning, saved named workspace presets, new geometry operations, a new document format, or deployment changes. The existing sketch-list accordion remains inside its own panel; replacing it with the scratchpad's flat fake entity buttons is not part of this change.

## Decisions

### Panel registry and application composition

Introduce an application-owned registry with stable ids, titles, icons, availability, and content renderers. Proposed integration defaults retain familiar placement: Model on the left; Properties and Selection on the right; Sketch entities on the left below Model while editing a sketch. Selecting a sketch in model view shows its feature settings and Edit sketch action without exposing the sketch-only entity and Selection panels. Properties keeps its identity while showing document title/parameters, sketch settings, extrude settings, or sheet settings according to existing context. Selection is the independent sketch inspector. In sheet mode, the existing sheet list and sheet properties/annotation editing remain available through registered contextual content. This avoids inventing new document or sheet editing workflows from mock stories.

Store positions for temporarily unavailable panels, and filter availability only when rendering. A changing title does not create a new panel or overwrite another panel's layout. Use the same dock shell in model, sketch, and sheet modes. A mode switch ends temporary fill if its target becomes unavailable.

### Separate layout state and bounded allocation

Use a small UI-only layout reducer for ordered panel ids per side, independent dock widths, fold states, preferred expanded weights, and dock collapsed states. Keep temporary fill outside persisted preferences. Layout changes never enter document actions or undo history.

Measure available workspace space with ResizeObserver. Subtract control strips, visible headers, and divider space before allocating content heights. Start with proportional preferred weights, enforce a minimum content height where feasible, and distribute the remainder deterministically. If the viewport is too short for every minimum, reduce content allocations before hiding any header; the finite registry keeps all headers reachable at supported desktop sizes. Preserve preferred weights when clamping for a shorter viewport so enlarging the window restores the arrangement.

Dragging a divider snapshots the displayed content heights, transfers pixels only between its neighboring expanded panels, then normalizes back to weights using the original weight total. Collapsed panels keep their weights. Width controls clamp against both dock limits and the space needed for a usable canvas. Proposed initial limits are 220–400 CSS px per expanded dock, a 240 px central viewport, 40 px minimum content height, and 16 px keyboard increments. When the window cannot meet all width minima, clamp actual widths below their preferences while retaining those preferences; narrow mobile layout is outside this change. Do not change allocations when an object's form becomes longer.

Use one-pixel token-based boundary lines with larger invisible resize hit areas. Avoid the scratchpad's earlier enclosing double borders and gutters. Dock controls belong to a distinct strip; inner headers use disclosure chevrons, a title/icon drag handle, and one maximize/restore control.

### React Aria helpers and focus

Use the already installed `react-aria-components` `useDrag` and `useDrop` for panel title handles and named insertion targets. They provide keyboard movement and announcements. General dock splitting is not provided by this package; implement bounded pointer-capture and keyboard separators without adding a docking dependency. Reuse generic kit controls and tokens; domain panel ids and content stay in the application.

A successful move removes the id from its old position before inserting it once in the destination. Cancel leaves state unchanged. Keep visible drop feedback without permanent thick insertion bars. Restore focus to the moved header, folded header, collapsed rail icon, or restore button as appropriate. Prevent handled layout keys from reaching modelling commands. Pointer cancellation and component unmount must clean up resize state.

### Rails and temporary fill

Each collapsed rail shows its current available panel icons in order plus a whole-dock reopen control. Icons use the same identity in the expanded title and rail, with distinct labels and tooltips. Keep identity icons different from maximize/restore actions; use the accepted outward/inward corner pair for those actions. No duplicate restore in the frame and no dock toggles in the top toolbar.

Opening an icon reveals its panel in temporary fill, without changing saved folded states or proportions. A whole-dock reopen restores its prior session arrangement. Fill rendering hides siblings without destructively replacing normal layout state; restore uses that retained state. Prefer preserving mounted form state when temporarily hiding panels. Moving a panel ends fill before applying the normal-layout move. A rail is not an overlay, so opening it resizes the actual canvas.

### Inspector content

Separate form bodies from panel/disclosure wrappers in `Properties.tsx`. Render the selected object's primary fields directly. Keep all existing LenField parsing, expressions, derived markings, deletion, construction, grouping, and rectangle refusal behavior. A parent action selects the rectangle's four members through existing selection actions. Constraint selection takes priority over retained geometry selection and edits the referenced slot using existing actions; its target-line action clears the constraint. Stale targets fall back to an empty inspector rather than editing a different object.

This deliberately replaces the old parent-form and three-window requirements through the accompanying deltas. Model/document and sheet editing semantics remain unchanged.

### Preference migration

Use a versioned dock-layout preference separate from the legacy `drafter.layout` payload, leaving the legacy value available for rollback. Load validated ids once, discard duplicates/unknown ids, insert missing registered defaults, and reject non-finite dimensions. Legacy-only installations start with the new defaults rather than mapping one Selection pixel height into unrelated panels. Persist normal layout changes, not temporary fill, document-specific selection, or viewport clamping. Storage failures fall back to session state.

## Risks / Trade-offs

- Short windows can leave little content space: retain headers, allow internal scrolling, and provide temporary fill. Test all panels in one dock, all folded, long lists, and viewport shrink/restore.
- Frequent context changes can lose placement or focus: use stable ids and retain unavailable entries without rendering empty panels.
- Remounting panels can discard draft input: preserve content instances when practical and verify normal Enter/blur/Escape semantics around movement and folding.
- Resizing the canvas affects fit and pointer mapping: measure the real central viewport, retain camera/view state, and test existing fit and picking after dock changes.
- Mock stories omit real actions: migrate actual forms, with regression coverage for expressions, constraints, rectangle actions, extrudes, and sheets.

## Migration Plan

Implement and test reusable layout behavior in Storybook first, then replace app sidebar composition with the registry and dock shell. Update existing layout assertions and documentation in the same change. Validate the preference fallback and cross-mode behavior before removing old pane sizing usage. Rollback restores the old shell using the untouched legacy preference; model documents require no migration.
