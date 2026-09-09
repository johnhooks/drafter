# Drawing

A small parametric modeller that runs in the browser. Sketch lines on a plane, extrude the regions they enclose into solids, and sketch on any face of what you built. Every length is an exact sixteenth of an inch.

```shell
pnpm install
pnpm dev          # the app
pnpm test         # unit tests
pnpm test:e2e     # browser tests
pnpm docs:dev     # documentation site
```

The documentation site in `docs/` covers the concepts, the sketch editor, constraints and expressions, and the file format. Conventions for working on the code are in `AGENTS.md`.
