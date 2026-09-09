## Why

The kit's intent, a flat, dense, one-accent look built only from tokens and React Aria data attributes, lives in an archived change's design and a documentation page. Neither is read by an agent working inside `packages/kit`. A short `AGENTS.md` in the package, with a `CLAUDE.md` that imports it, puts the rules and the idioms where the work happens.

## What Changes

- `packages/kit/AGENTS.md`: the visual language in a few lines; the rules (tokens only, style through data attributes, story and test per component, icon-only controls are labelled, no literal colours); the idioms the app has settled on, including view state as a cluster of icon toggles rather than a menu, commit-on-blur fields, row actions on hover, and the ListBox detail slot; the commands.
- `packages/kit/CLAUDE.md` containing `@AGENTS.md`, the import form Claude Code reads, rather than a symlink.
- The repo root `CLAUDE.md` changes from a symlink to the same one-line import, so both follow one convention.
- The Develop UI Kit page links to the file rather than repeating its rules.

No application or kit behaviour changes.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None.

## Impact

- Two files in `packages/kit`, the root `CLAUDE.md`, and one link in `docs/src/content/docs/develop/ui-kit.md`.
