# AGENTS.md

## Project

Drawing is a small parametric modeller that runs in the browser. Sketch rectangles on a plane, extrude them into solids, and sketch on any face of what you built. Every length is an exact whole number of sixteenths of an inch. Nothing is sent to a server; documents live in browser storage and in JSON files the user downloads.

The application is general purpose. Documentation and examples describe modelling in its own terms and do not assume a particular kind of object being modelled or compare the tool to other software.

## Stack and commands

pnpm, Vite, React 19, TypeScript in strict mode, react-three-fiber and drei over three.js for the 3D view, zustand for state, Vitest for unit tests, Playwright for end-to-end tests, Astro with Starlight for the documentation site.

```shell
pnpm dev          # app at http://localhost:5173
pnpm test         # Vitest, unit tests for the core and store actions
pnpm test:e2e     # Playwright against a dev server on port 5199
pnpm typecheck
pnpm build
pnpm docs:dev     # documentation site
pnpm docs:build
```

Playwright launches Chromium with software GL so the three.js view renders headlessly. In development builds the app exposes a read-only `window.__debug()` for tests to read state; do not use it from application code.

## Code organization

`src/core` is pure TypeScript with no React, three.js, zustand, or DOM dependency. A test fails the build if that boundary is crossed. Units, geometry, the document model, expressions, and evaluation live there and are unit tested. `src/ui` is a thin React layer over the core: a zustand store whose actions are pure functions `(state, payload) => state` in `src/ui/store/actions.ts`, the sketch editor, the 3D view, and the properties panels.

Lengths are integers in sixteenths of an inch. The `Sixteenths` brand marks resolved values; document slots are `Len = number | string`, where a string is an expression. Never store floating point lengths. Round to a whole sixteenth at the edge, in `parseLength` or at the end of an expression evaluation.

Solids are sets of disjoint axis-aligned boxes. Join and cut are exact box subtraction. Faces are derived from the boxes, never stored. Everything downstream (picking, sketch reference geometry, face references) relies on all geometry being axis-aligned; do not introduce geometry that is not.

Evaluation is a pure function over the document. Every edit re-evaluates the whole timeline in order; nothing derived is stored in the document.

Sketch tools are small state machines implementing the `Tool` interface in `src/ui/sketch/tools.ts`, with a `preview()` rendered by the same code as committed rectangles. Snapping is an ordered list of snappers in `src/core/snap.ts`; add a snapper rather than special-casing the pointer handler.

## Workflow

Changes are planned and tracked with OpenSpec under `openspec/`. A change has a proposal, delta specs, a design, and tasks; implementation follows the tasks and ticks them off; archiving merges the delta specs into `openspec/specs/`. A change that alters behaviour must carry specs. Tooling and documentation changes set `skip_specs: true`.

Sequence matters when one change modifies a capability another change introduced: archive the earlier change first.

## Commits

Use `/commit`, or follow `.claude/commands/commit.md`: a conventional commit title of 50 characters or less that says what changed, not what was removed to make room for it; a body only when the why is not obvious; stage by explicit path. No co-author trailers, no session links, no emoji. Never push without being asked.

## Testing

Core behaviour gets a Vitest test in `tests/core/`; store actions in `tests/ui/`. Geometry tests compare volume, bounds, and faces, never the internal box list, because the disjoint decomposition is not canonical. User interface behaviour that a spec scenario describes gets a Playwright step in `tests/e2e/`. Playwright cannot click a zero-height SVG line; click a label or use `page.mouse` with computed coordinates. The r3f canvas reports its default 300 by 150 size for a frame after mounting; wait for the real size before computing click positions.

## Documentation

The documentation site lives in `docs/` and uses Astro with Starlight. Run `pnpm docs:build` after documentation changes.

Write documentation as current product documentation. Do not mention implementation phases, review checkpoints, future documentation work, OpenSpec changes, or temporary plans. When behaviour, the file format, or commands change, update the affected page in the same change.

Structure guides for scanning: a short lead that says what the thing is and when to use it, then a small set of task-oriented sections. Put a rule that surprises people (the slot keep rule, the mirrored view on a back face) in an aside beside the behaviour it qualifies, stating the concrete outcome. Use link cards for prerequisites. Do not add "next steps" sections; the sidebar is the navigation.

Use inches with fractions in every example, written the way the app displays them: `35 1/4"`. Expression examples must evaluate as stated; check them against the core when in doubt.

Keep `README.md` to a short overview, the commands, and a link to the site. Do not duplicate guide content there.
