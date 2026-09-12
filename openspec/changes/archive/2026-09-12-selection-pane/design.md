## Context

`App.tsx` puts `<Properties />` in one kit `Panel` on the left; `SketchProperties` renders the sketch fields, the Rectangles, Regions, and Lines lists, then the selection forms, then the constraint list, in one scrolling body. The kit `Panel` is a flex column whose body scrolls, and takes a `title` that renders a header. See proposal.md.

## Goals / Non-Goals

**Goals:**
- The selected thing's form has a fixed place with a header, like a detail view.
- No change to the forms or the store.

**Non-Goals:**
- A selection pane in the model view; extrude and document properties keep the single column.

## Decisions

**Three kit panels in a flex column.** `PropertiesColumn` renders the document and extrude properties in one panel as before, and for a sketch a `.props` flex column of three panels: the sketch fields with a minimize button in the panel's actions slot, the lists, and the Selection pane. `Properties.tsx` exports the pieces, `SketchFields`, `SketchLists`, and `SelectionPanel`, rather than one `SketchProperties`. Alternative: one panel with custom scroll regions inside. Rejected: the kit panel already gives each window its header, divider, and body.

**Minimize is state, not a disclosure.** The sketch window keeps its title bar and hides its body when minimized, so the lists panel, which is `flex: 1`, takes the freed height with no further layout work. Session state only; a window that was minimized is restored on the next visit.

**Accordion by controlled disclosures.** `SketchLists` holds which list is open and passes `isExpanded` and `onExpandedChange` to each kit `Disclosure`, which forwards them to React Aria. The lists panel body is a flex column with overflow hidden; a closed disclosure is `flex: 0 0 auto`, the open one `flex: 1 1 auto` with its panel a flex column, and the list inside sits in a `ScrollArea` that scrolls. Regions is open to start, since a fresh sketch has no rectangles and regions are what an extrude takes. The `[hidden]` panel of a closed disclosure needs an explicit `display: none` because the flex rule would otherwise override the attribute.

**Default proportion, then pixels.** `.props-main` is `flex: 1 1 auto` and `.props-selection` defaults to `flex: 0 0 45%`, both `min-height: 0` so each body scrolls independently. Forty-five percent holds the rectangle form plus the line form for a member line at the default window height. Once the user drags the divider the pane's flex basis is a pixel height held in `PropertiesColumn` state, clamped to at least 120 px for the pane and 160 px for the sketch region, and stored under its own `drafter.layout` key in local storage rather than in the sketch `Display` preference, because it is window layout, not sketch content, and the display object is asserted whole by tests and the debug hook. Double-click clears the stored height and the default proportion returns.

**Divider.** A hairline `role="separator"` between the lists and the pane, the width of every other panel line, with a 7 px hit area from a pseudo-element so it is still easy to grab; it shows the focus colour on hover, on keyboard focus, and while dragging. Pointer capture carries the drag, arrow keys move it in 16 px steps, and `aria-valuenow` reports the pixel height. Alternative: a thicker bar to advertise the affordance. Rejected: the hover colour is enough and a heavy line reads as a border.

**Scroll cue.** A `ScrollArea` component wraps each list and the pane's content: an outer flex box carrying the fades as pseudo-elements and an inner scrolling box. Its `useScrollEdges` hook measures the inner box on scroll and on any resize of it or its children, and sets `data-more` to the edges with content beyond them; CSS fades each such edge from the panel surface colour, so it reads in both themes. Alternative: the background-attachment scroll-shadow trick with no script. Rejected: it needs the scrolling box's own background to carry the gradients and it is invisible under opaque rows.

**What the pane shows.** The selection branches move out of `SketchProperties` unchanged: single member line shows the rectangle form then the line form; four member lines or a filling region show the rectangle form; four loose lines show Make rectangle. Two new branches: a count, "3 lines selected" or "2 regions selected", and the empty hint. The constraint list stays in the sketch region because it is a list of the sketch, not a property of the selection.

**Hint copy.** "Nothing selected. Click a line or region in the view, or choose one from the lists."

## Risks / Trade-offs

- [Forty-five percent is too little on a short window and the line form scrolls] → The pane scrolls with a fade, and the divider sets the height.
- [Tests and users expecting every list open find only one] → The `openList` helper opens the one a test reads; the count in each closed header says what is inside.
- [The pane header adds a row that pushes the lists up on small screens] → Acceptable; the header is the point, it names the region.
