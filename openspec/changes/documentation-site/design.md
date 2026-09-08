## Context

The app has one change implemented (`sketch-extrude-modeler`) and one applied on top (`sketch-constraints`). Both are described only by OpenSpec artifacts. The documentation should describe behaviour as it stands, drawn from those specs and the code, in a form a user can read.

## Goals / Non-Goals

**Goals:**
- One site, scannable guides, task-oriented subsections, consistent voice.
- Conventions written down so documentation moves with behaviour changes.

**Non-Goals:**
- Deployment. The site builds locally; hosting is a later decision.
- API reference generation. The core is not a published library yet.

## Decisions

**Astro with Starlight and the Nova theme, in `docs/`.** Matches a docs setup the team already maintains, so the conventions transfer. Astro 7 runs on Node 22.12 and later, which this machine has, so no Node change is needed.

**Sidebar is fixed in `astro.config.mjs`,** ordered as a reader would learn the tool: what it is and how to run it, the modelling concepts, sketching, constraints, files, then development.

**Page shape.** Each guide opens with what the thing is and when to use it, then sections named for tasks. Asides for rules that surprise people (the slot keep rule, the mirrored back-face view). Link cards for prerequisites. No "next steps" sections; the sidebar is the navigation.

**Voice.** Present tense, current behaviour only. No phases, plans, or references to specs or changes. Units are inches with fractions throughout.

**Workspace.** `pnpm-workspace.yaml` lists `docs` so one lockfile covers both packages; root scripts delegate with `pnpm --filter`.

## Risks / Trade-offs

- [Docs drift from behaviour] → `AGENTS.md` states that a change altering behaviour updates the affected page in the same change, mirroring the OpenSpec rule that specs move with behaviour.
- [Astro build time and dependency weight in the repo] → Isolated in `docs/`; the app build does not touch it.
