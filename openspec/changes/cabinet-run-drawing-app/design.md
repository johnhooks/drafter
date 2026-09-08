## Context

Greenfield. No code exists. Behaviour is in the eight specs under `specs/`; this document covers structure and the technical choices behind it. The one forward-looking constraint is that a later change will add constraint expressions and alignment rules, so the document model must not paint that in.

## Goals / Non-Goals

**Goals:**
- A core that is pure TypeScript with no DOM dependency, so layout and every view are unit tested and the same code produces the on-screen drawing and the exported file.
- Exact fractional inches everywhere.
- A UI thin enough that most bugs are core bugs.

**Non-Goals:**
- Any constraint solving, expressions, or alignment (next change).
- Drag interactions, undo/redo, keyboard shortcuts.
- Multiple walls, corners, angled walls.
- Hidden line removal beyond painter's ordering in the isometric.
- Mobile layout.

## Decisions

**Lengths are integers in sixteenths (`type Sixteenths = number` branded).**
Alternatives: floats in inches (drift, ugly fractions after arithmetic), a rational library (heavier, unnecessary since 1/16" is the finest builders use). Integers make every sum exact and make equality tests trivial. Formatting reduces the fraction on output.

**Core / UI split.** `src/core` holds `units`, `model` (types, defaults, validation, item factories), `layout`, and `views/{elevation,section,isometric}`. Nothing in `src/core` imports Preact or touches `document`. `src/ui` holds Preact components and the persistence glue. Alternative: render SVG with Preact components. Rejected because export would then require serialising live DOM, and view tests would need a DOM. Views return an SVG string and are tested with Vitest snapshots plus targeted string assertions.

**Views return strings; the UI injects them and uses event delegation.** Each box element carries `data-item-id`, each editable dimension label carries `data-item-id` and `data-dim="width" | "height" | "wall"`. One click handler on the drawing container reads those attributes. This keeps the views free of callbacks and keeps the exported SVG identical to what is on screen (data attributes are harmless in the file). Inline editing renders an HTML input positioned over the label using the label's bounding rect, not a `foreignObject`, so export never contains form elements.

**SVG user units are inches, y flipped once.** Views compute in inches with y up from the floor, then wrap the drawing in a group with `transform="scale(1,-1)"` and place text in a counter-flipped group so labels read correctly. Alternative: flip every y by hand. Rejected as a bug farm. Stroke widths use `vector-effect: non-scaling-stroke` so zoom does not fatten lines. Styles are inline attributes or a `<style>` block inside the SVG so the export stands alone.

**Layout output.** `layout(doc)` returns `{ boxes, counters, toeKicks, warnings }`. A box is `{ id, kind, x, y, z, w, h, d, label, fronts: ResolvedFront[] }` with all lengths in sixteenths and every default already applied. Views never look at the document; they only see this. This is also the seam for the future constraint change: expressions will resolve inside layout, and views will not care.

**Fronts resolution.** `resolveFronts(cabinet, height, reveal)` turns the declared stack into rectangles inside the box: reveal around the outside, reveal between fronts, last front fills the remainder, double doors split evenly with a reveal between leaves. Shared by elevation and isometric.

**Isometric projection.** Standard 30 degree isometric: screen x = (x - z) * cos30, screen y = y + (x + z) * sin30, with the viewer at front-left-above so the visible faces are top, front, and left. Painter's order: sort boxes by (x + z) descending, then y ascending, so farther-right and deeper boxes draw first and the box in front covers them. For a single wall run with axis-aligned boxes this is sufficient; it is documented as a known limitation for exotic overlaps. Counter and toe kick segments are boxes for this purpose.

**Section position.** The section view takes an x in sixteenths. The UI passes the centre of the selected item if there is one, else the centre of the first base row cabinet, else 0. The view filters boxes and segments whose x range contains it.

**Document format.** JSON with `version: 1` at the top level. Lengths are stored as sixteenths integers; optional overrides are absent when unset (not null). Validation is a hand-written function returning `{ path, message }[]`; no schema library, the format is small. Loading a file runs validation first and refuses on any error.

**UI framework: Preact with hooks, single `useReducer` for the document.** Alternatives: React (bigger, no benefit), vanilla (more code for the forms). State: `{ doc, selectedId, view, editing }`. Every reducer action produces a new doc; an effect persists it to `localStorage` under one key. Row lists, add forms, and the properties panel are separate components taking props and dispatching actions.

**Testing.** Vitest for `src/core` with high coverage: units parse/format tables, model factories and validation, layout positions and warnings, views via snapshots plus assertions that specific labels and ids appear. UI has no automated tests in this change; the tasks include a manual checklist per editor spec scenario.

**Project layout.**
```
src/core/units.ts
src/core/model/{types,defaults,factories,validate}.ts
src/core/layout/{layout,fronts,counter}.ts
src/core/views/{svg,dimensions,elevation,section,isometric}.ts
src/ui/{App,RowList,AddItemForm,Properties,Drawing,InlineEdit,Warnings}.tsx
src/ui/{store,persist,exportFile}.ts
src/main.tsx, index.html, print.css
tests/core/**
```

## Risks / Trade-offs

- [Painter's ordering fails for some overlaps, e.g. a shallow tall next to a deep base] → Acceptable for a wall run; documented; a later change can add per-face depth sorting.
- [Automatic dimension placement collides for very narrow items] → Labels for items under 6" are drawn above the chain line with a leader; still automatic.
- [Inline edit input positioned over an SVG label drifts on zoom or resize] → Position is recomputed from the label's bounding rect at open time and the edit closes on window resize.
- [localStorage quota or private mode] → Save is wrapped in try/catch; failure shows a non-blocking notice; the app keeps working in memory.
- [Storing sixteenths as bare integers makes hand-edited JSON unfriendly] → Accepted; the JSON is a save file, not an authoring format. A later change may add a text format.
