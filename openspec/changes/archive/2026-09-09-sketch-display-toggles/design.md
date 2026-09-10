## Context

`SketchEditor` computes `labelsOf` for every region and free line and renders them all, draws each line's handle beside it, and holds hover state for the line and region under the pointer. The store has a `showDims` boolean toggled by a text **Dims** button; it is not persisted. Theme is persisted by `loadTheme` and `saveTheme` in `persist.ts`. The kit has `ToggleButton` (text) and `IconButton` (not a toggle). See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Nothing labelled by default; labels reachable by hover, selection, focus, or a toggle, with no change to how they are placed or edited.
- View preferences that survive reloads without touching the file format.

**Non-Goals:**
- Per-document display state.
- New label kinds or new placement rules.

## Decisions

**A `display` preference object in the store.** `display: { grid: boolean; dims: boolean; handles: boolean; sizes: boolean }` replaces `showDims`. `setDisplay(patch)` updates it; `loadDisplay` and `saveDisplay` in `persist.ts` mirror the theme functions under one localStorage key with defaults `{ grid: true, dims: true, handles: false, sizes: false }`. Alternative: put it in `view` in the file. Rejected: the toggles are about the person looking, not the model, and the file's view part is the camera and open sketch.

**Visibility is decided in the editor, not in `labelsOf`.** `labelsOf` keeps returning every label so hit testing and drag targets are unchanged; the editor filters what it renders: a label renders when `display.sizes`, or its target is hovered or selected, or it is the label being edited. Handles render when `display.handles`, or the line is hovered or selected, or `exprFocus` is true. Filtering at render keeps the placement code untouched and the e2e drag tests valid once they hover or select first.

**Expression focus is a store flag set by the fields.** `LenField` dispatches `setExprFocus(true)` on focus and `false` on blur. Only `LenField` does this, so name and title fields do not light the handles. Alternative: detect focus in the editor through `document.activeElement`. Rejected: the editor would need to know which inputs count.

**Selected region shows sizes, not handles.** A region selection is about its shape; its lines light up only when selected themselves or hovered.

**Toggle cluster.** A `ToggleIconButton` in the kit: `IconButton`'s look with `ToggleButton`'s state, `data-selected` styled with the accent like the tool toggles, tooltip from `aria-label`, `size` md. Story with the four states and a test that Space toggles it. In `App`, a group at the right end of the sketch toolbar before the More menu, order grid, dims, handles, sizes, with icons from Lucide (`grid-2x2`, `ruler`, `tag`, `move-horizontal` or equivalents added to `Icon`'s map). The text **Dims** toggle goes.

**Grid off.** The grid lines are skipped; the origin mark stays; snapping is unaffected because it never depended on the grid drawing.

## Risks / Trade-offs

- [A new user does not find the width label] → The live size while drawing is unchanged, hover shows it at once, and the first-part guide points at hover.
- [Hover flicker between a line and the region beneath it] → Hover state already distinguishes line and region; showing the region's labels while a bounding line is hovered avoids the flash when crossing a line. The editor treats a hovered bounding line as hovering the region too.
- [Playwright labels not present until hover] → Tests hover or select first; the helpers gain `hoverInches`.
