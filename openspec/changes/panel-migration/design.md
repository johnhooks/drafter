## Context

The app has a zustand store with pure actions, a `LenField` that parses lengths and expressions, a timeline of hand-rolled rows, a properties panel of labelled inputs, `window.confirm` for confirmations, and a notice strip. The kit provides the equivalent components with tokens and two themes. End-to-end tests locate elements by text and a few class names.

## Goals / Non-Goals

**Goals:**
- Every panel control is a kit component; the app stylesheet holds only layout and the drawing surfaces.
- No behaviour change beyond the theme setting; every existing end-to-end scenario still passes, with selectors updated.

**Non-Goals:**
- Theming the sketch editor and 3D view colours.
- Any new panel behaviour, reordering, or drag and drop.

## Decisions

**`LenField` becomes a thin wrapper over kit `TextField`.** It keeps its props (`value: Len`, `resolved`, `error`, `derived`) and supplies `validate={parseLen}` and `monospace` when the value is an expression. The commit, revert, and error semantics are the kit's, which already match the spec.

**Toolbar composition.** `Toolbar` with: title, `IconButton undo` and `redo` (new Lucide-backed icons `undo` and `redo`), then per mode. Model mode: `Button` New sketch opening a `Dialog`, `ToggleButton` Pick face. Sketch mode: `ToggleButtonGroup` Select, Rectangle, Link; `ToggleButton` Dims; `Button primary` Extrude; `Button` Finish. Far end: `IconButton ellipsis` opening a `Menu` with Export SVG or PNG, Download JSON, Open JSON, New document, and a Theme section with Light and Dark items.

**New sketch dialog.** A `Dialog` with `Select` plane, `TextField` offset via `LenField`, `Checkbox` flip normal, and two buttons: Create, and Pick a face instead. Replaces the ad hoc dropdown.

**Timeline is a `ListBox`** with `actionSlots={2}`, single selection bound to `selection.featureId`, `detail` showing the sketch handle, `tone="error"` when the feature's result is an error, and the error message as a second line under the row (a small element the app renders below the item, not a kit feature). Actions: `IconButton pencil` Edit for sketches, `IconButton trash` Delete. Delete opens a `ConfirmDialog` whose body lists the dependents, replacing `window.confirm`.

**Properties panels use `Panel`, `Fields`, `Row`, `Field`, `Hint`, `Disclosure`.** Rectangle, constraint, and parameter lists are `ListBox` items with `detail` for values and `IconButton` actions. Selects for operation, target body, and plane. The rectangle slot fields are three `LenField`s per axis in a `Row`.

**Notices become toasts.** `notify` in the store stays as the source of truth for messages; a store subscriber forwards new notices to the kit's `toast()` and clears them from state, so existing actions and tests that check `notices` keep working through the debug hook. Errors and refusals (anything from a refused edit, a failed file, corrupt storage) use `tone: 'danger'` or `'warning'` with no timeout; informational messages time out after five seconds.

**Theme.** `ThemeProvider` wraps the app; the choice lives in the store as `theme` with a `setTheme` action, persisted under `drawing.theme` beside the document key, restored on load. The root element's `data-theme` follows it. Sketch and 3D surfaces read their own fixed colours as today.

**End-to-end tests.** Selectors move to roles and labels (`getByRole('button', { name })`, `getByRole('option', { name })`, `getByRole('dialog')`), which the kit's accessibility makes reliable. The drawing-surface helpers are unchanged.

**Stylesheet.** `styles.css` keeps the app grid, the sketch and model view rules, the inline-edit input, and the axis indicator; everything else is deleted. The kit's `tokens.css`, `base.css`, and both theme files are imported once in `main.tsx`.

## Risks / Trade-offs

- [Selector churn breaks the end-to-end suite] → Rewrite selectors as part of each panel task, run the suite after each, not at the end.
- [Toasts hide a refusal the user needs to read] → Refusals and errors do not time out; they stay until dismissed.
- [Dark panels beside a light sketch surface look unfinished] → Stated as a non-goal here and noted for a follow-up that themes the surfaces.
