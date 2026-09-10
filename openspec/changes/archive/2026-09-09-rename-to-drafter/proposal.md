## Why

The project has carried the placeholder name "Drawing" since the first change. It is a personal drafting tool, and Drafter names the thing that does that work; the placeholder also collides with the generic word in every sentence of the documentation. The package scope becomes `@bitmachina`, the owner's registry scope, so a published package would need no rename.

## What Changes

- The application is called Drafter: browser tab title, README, AGENTS.md, and the documentation site title and prose.
- Packages: the app is `@bitmachina/drafter`, the kit `@bitmachina/drafter-kit`, the docs `@bitmachina/drafter-docs`. Imports and workspace filters follow.
- Browser storage keys move from `drawing.*` to `drafter.*`. The document key reads the old key once when the new one is empty, so a stored model comes along.
- The default download name for an untitled document becomes `drafter`.

No behaviour changes beyond the storage key fallback.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None.

## Impact

- `package.json` files, `pnpm-lock.yaml`, every import of the kit, `persist.ts`, `exportFile.ts`, `index.html`, `astro.config.mjs`, the docs pages that name the app, the kit's `AGENTS.md`, and one Storybook story.
