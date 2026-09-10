## Why

The only descriptions of how the modeller works are OpenSpec requirements and test files. Someone opening the app has no guide to planes, the timeline, or how constraints and expressions behave. A documentation site written as current product documentation fixes that and gives later changes a place to update.

## What Changes

- A Starlight documentation site in `docs/` with a fixed sidebar: Start Here, Modelling, Sketching, Constraints, Files, Development.
- Pages written for the product as it is: a parametric sketch-and-extrude modeller with exact fractional-inch geometry. No project-specific use cases, no comparisons to other software, no product name beyond the working title.
- A root `README.md` that points at the site, and an `AGENTS.md` with the project's documentation conventions so later changes keep the docs current.
- Root scripts `docs:dev` and `docs:build`.

No application behaviour changes, so this change carries no specs.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None.

## Impact

- New `docs/` package with its own dependencies (Astro, Starlight, the Nova theme), built separately from the app.
- `pnpm-workspace.yaml` so the docs package shares the lockfile.
- No runtime impact on the app.
