## Context

Greenfield. The behaviour is in the nine specs under `specs/`. The shape of the problem is unusual in one helpful way: every sketch plane is axis-aligned and every extrude is along an axis, so all solid geometry is a union of axis-aligned boxes. That single fact makes exact booleans, face extraction, and picking tractable without a CAD kernel. The design leans on it everywhere, and the non-goals below are the price.

## Goals / Non-Goals

**Goals:**
- Exact geometry: integer sixteenths end to end, exact union and cut, exact face outlines.
- A DOM-free core (units, solids, planes, sketch, extrude, evaluation) that is fully unit tested; the UI is a thin shell over it.
- A parametric timeline that re-evaluates in well under a frame for models of a few hundred boxes.
- File format that will survive later features (circles, constraints, drawing views).

**Non-Goals:**
- Any geometry that is not an axis-aligned box: no circles, no angled planes, no fillets. Adding those later means replacing the solid representation, and that is accepted.
- Orbit camera (three.js makes it a one-line change later; the fixed camera is a UI decision, not a technical one).
- Timeline reordering, rollback, undo/redo.
- Feature-level sketch constraints.

## Decisions

**Lengths are integers in sixteenths (`type Sixteenths = number`, branded).** Same reasoning as before: exact arithmetic, trivial equality, no drift after repeated booleans. Volumes are integers in sixteenths cubed.

**Bodies are sets of disjoint axis-aligned boxes; booleans are box subtraction.** `subtract(a: Box, b: Box): Box[]` returns up to six disjoint boxes covering `a` minus `b`. `cut(body, box)` maps subtract over every box. `join(body, box)` is `cut(body, box)` plus `box`, which keeps the set disjoint without an explicit overlap test. After each operation, `compact(body)` merges pairs of boxes that share a full face to keep counts down. Alternatives: a real B-rep or a CSG library (three-bvh-csg, manifold). Rejected: floating point results, much larger dependency, and no benefit while everything is axis-aligned. Known limitation: disjoint decomposition is not canonical, so tests assert volume, bounds, and faces, never the box list itself.

**Faces are derived, not stored.** `faces(body)` walks each box's six faces, subtracts the coplanar faces of neighbouring boxes on the same plane (2D rectangle subtraction), and merges adjacent results on the same plane and direction into rectilinear polygons using a rectangle-union routine. Faces are used for the sketch reference fills, for picking, and for `sketch-planes` resolution ("is this face still present").

**Face references are by extrude feature and face role, not by geometry.** `{ featureId, face: 'cap' | 'base' | 'uMin' | 'uMax' | 'vMin' | 'vMax' }`. Resolution computes the plane from that extrude's box at evaluation time (its sketch plane, distance, and the rectangle's bounds), then checks with `faces(body)` that some exposed face lies on that plane with that direction and overlaps the extrude's rectangle; otherwise the reference errors. Alternative: reference by plane coordinate. Rejected because it breaks the moment an upstream distance changes, which is the whole point of a parametric timeline. Alternative: full topological naming as in real CAD. Rejected as unnecessary while faces come from box extrudes. If an extrude has several rectangles, the reference also carries the rectangle id.

**Sketch plane coordinate frames.** Fixed (u, v) per principal plane: XZ has u = x, v = z; XY has u = x, v = y; YZ has u = y, v = z. The normal sign only affects extrude direction and which side the sketch view looks from. The sketch view looks along -normal with v up; u therefore reads left-to-right for XZ with normal -Y, XY with normal +Z, and YZ with normal +X, and right-to-left for the opposite normals. This mirroring is correct (you are looking at the back of the part) and is shown with an axis indicator in the corner.

**Evaluation is a pure function `evaluate(doc): EvalResult`.** It walks features in order, keeping `bodies: Map<id, Body>` and `featureResults: Map<id, SketchResult | ExtrudeResult | FeatureError>`. Sketch results carry the resolved plane and reference geometry computed from the bodies at that point (so reopening Sketch 2 shows the world as it was before Extrude 2). Every edit re-runs the whole thing; at this scale that is microseconds to low milliseconds and avoids incremental invalidation bugs. Dependency deletion uses a small graph built from feature references.

**3D view uses react-three-fiber over three.js, with drei for camera and controls.** The scene is declared from state: one `<mesh>` per body whose `BufferGeometry` is built from `faces(body)` (each face rectangle as two triangles, shaded by orientation) plus `EdgesGeometry` lines, so the reconciler replaces meshes when bodies change and nothing is hand-managed. drei's `OrthographicCamera` sits at the isometric angle; `OrbitControls` with rotation disabled gives pan and zoom, and enabling rotation later is one prop. Picking is r3f's pointer events: `onPointerDown` on a mesh gives the hit point and face normal, which map to a plane and then to the extrude and face role that owns that point. Depth buffering gives correct hidden surfaces, which an SVG painter's approach cannot guarantee once bodies have pockets. Alternatives: plain three.js with a hand-written render loop and raycaster (more code for the same result); a custom SVG renderer (hidden-surface removal for unions of boxes with holes is a project in itself). PNG export reads the canvas back with `preserveDrawingBuffer` on.

**Sketch editor is SVG rendered by React, with event delegation and inline inputs.** Rectangles and labels carry `data-rect-id` and `data-dim`; a `viewBox` in inches with a `scale(1,-1)` group gives v up; inline editing is an HTML input positioned over the label.

**Tools are small state machines with a shared preview path.** Each tool (select, rectangle; later rectangle-by-size, circle) is an object with `state`, `onPointerDown/Move/Up(snapped)`, `onKey`, `cancel()`, and `preview(): SketchEntity[]`. The editor renders `preview()` on every move with the same code that renders committed rectangles, so what you see while dragging is exactly what gets committed. This is the pattern QCAD uses for every drawing action (`setState` plus `pickCoordinate(event, preview)`) and it keeps tool logic out of the pointer handler. Alternative: one pointer handler with a mode switch. Rejected because it stops scaling at the third tool.

**Snapping is an ordered list of snappers.** `snap(pointer, ctx)` runs snappers in priority order and returns the first hit within range, with the kind of snap for the indicator: rectangle corner, reference face corner, rectangle or reference edge (per axis), then sixteenth grid. Each snapper is a pure function over `(pointerInches, candidates, rangeInches)`. Adding midpoints or centers later is one more entry. This mirrors QCAD's auto-snap chain (intersection, endpoint, middle, center, ..., grid, free). Candidates are gathered per axis from reference face edges, outline edges, and other rectangles; only edges inside the visible viewport are considered.

**State: one zustand store with reducer-style actions.** Shape `{ doc, eval, mode: { kind: 'model' } | { kind: 'sketch', sketchId } | { kind: 'pickFace' }, selection, editing }`. Every action is a pure function `(state, payload) => state` in `src/ui/store/actions.ts`, tested without React; the store wraps them and recomputes `eval` whenever `doc` changes, so components never call `evaluate` themselves. r3f components subscribe to the slices they need (bodies, selection) without prop drilling. Persistence subscribes to `doc`. Alternative: React `useReducer` plus context. Rejected because every 3D component would re-render on any state change and the r3f ecosystem assumes an external store.

**Document format.** `{ version: 1, title, features: Feature[] }`. Features are plain data with ids; no derived geometry is saved. Validation is hand-written (`{ path, message }[]`) and checks ids, references, and value ranges before load.

**Project layout.**
```
src/core/units.ts
src/core/geom/{box,body,faces,rect2d}.ts
src/core/model/{types,planes,sketch,extrude,validate,names}.ts
src/core/eval/{evaluate,deps}.ts
src/ui/{App,Timeline,Properties,SketchEditor,InlineEdit,Toolbar,Notices}.tsx
src/ui/store/{store,actions}.ts
src/ui/{persist,exportFile,snapping}.ts
src/ui/model/{ModelView,BodyMesh,IsoCamera,pick}.tsx
src/main.tsx, index.html
tests/core/**
```

**Testing.** Vitest on `src/core` with a geometry test helper that compares bodies by volume, bounds, and sorted face set. Property-style tests for box subtraction (volume(a) - volume(a and b) equals sum of pieces, pieces disjoint, pieces inside a). Snapshot tests for the sketch SVG. The r3f layer and the editor are checked by a manual walkthrough listed in tasks; a smoke test asserts the geometry builder's triangle count equals two per face rectangle.

## Risks / Trade-offs

- [Box decomposition grows after many cuts] → `compact` after every operation; models stay in the hundreds of boxes. If it ever matters, replace with a sweep-based merge.
- [Face merging into rectilinear polygons is the fiddliest core code] → Faces are only needed merged for the sketch reference fill and for "face still exists" checks; picking and rendering work on unmerged rectangles. Merge is implemented last and can ship as "draw the rectangles" if it slips.
- [Face role reference can be ambiguous when a cut splits a face into two regions] → Both regions share the plane and direction, so the sketch plane is still well defined; the reference fill shows both. Accepted.
- [three.js plus r3f plus drei bundle size] → Acceptable for a local tool; import drei components individually and expect roughly 200 KB gzipped.
- [Mirrored sketch views on back faces confuse users] → Axis indicator in the sketch view corner; the face stays highlighted in the 3D view while sketching.
- [Snapping candidates become many with large models] → Only edges within the visible viewport are candidates; sorted arrays and binary search per axis.
- [Corner snap and edge snap disagree at a corner] → Corner snappers run before edge snappers, so a pointer near a corner takes both coordinates from the corner.

## Open Questions

- Default extrude distance when the user has not typed one yet (proposal: 1", editable immediately). Does not affect specs or tasks.
