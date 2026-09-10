## Why

The application's panels predate the component library. They are hand-styled elements with browser confirms and a notice strip, styled by a stylesheet that now only maps colours onto kit tokens. Moving them onto `@drawing/kit` gives the app the kit's look, keyboard behaviour, and accessibility in one pass, and lets the two styling systems collapse into one.

## What Changes

- The toolbar, timeline, properties panels, parameters section, notices, and confirmations are rebuilt from kit components. The drawing surfaces, the SVG sketch editor and the three.js view, are untouched, including their inline dimension inputs.
- Toolbar: Undo and Redo as icon buttons; New sketch opens a small dialog (plane, offset, flip, or pick a face); the sketch tools are a toggle group; Dims a toggle; Extrude the primary action; file actions (download, open, new document, export) move into an overflow menu so the bar stays sparse.
- Timeline: a list with the feature name, its handle as detail, an error tone when it failed, and edit and delete actions in the gutter. Selection in the list is the store's selection.
- Properties: kit fields throughout. Length and expression fields use the kit `TextField` with the app's parser as the validator, `derived` marking, and monospace for expressions. Rectangles, constraints, and parameters are lists inside collapsible sections.
- Confirmations (delete cascade, new document) become dialogs that list what will happen; notices become toasts, persistent for errors and refusals, timed for information.
- A theme setting, light or dark, in the overflow menu, remembered in browser storage. The kit's dark theme applies to the panels; the sketch and 3D surfaces keep their own colours in this change.
- The app stylesheet shrinks to layout and the drawing surfaces.

Behaviour described by existing specs does not change: the same actions, rules, messages, and confirmations, presented through kit components. The only new behaviour is the theme setting, which has its own spec.

## Capabilities

### New Capabilities
- `app-theme`: choosing and remembering the light or dark theme.

### Modified Capabilities
None.

## Impact

- `src/ui` panels rewritten; `src/ui/styles.css` reduced; `@drawing/kit` becomes a runtime dependency of the app in earnest.
- End-to-end tests updated for the new structure; the debug hook and the drawing-surface interactions stay the same.
- Kit gains undo and redo icons.
