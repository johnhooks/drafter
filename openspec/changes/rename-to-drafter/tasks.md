## 1. Rename

- [x] 1.1 Rename the three packages to the `@bitmachina` scope, update the kit imports and workspace filter scripts, and refresh the lockfile; verify `pnpm install --frozen-lockfile` fails before and `pnpm install` then `pnpm typecheck` pass
- [x] 1.2 Rename the app to Drafter in `index.html`, README, AGENTS.md, the docs config and pages, the kit guide, and the dialog story; set the default download name; verify `pnpm docs:build` and `pnpm kit:build`
- [x] 1.3 Move storage keys to `drafter.*` with a one-time read of the old document key; verify a store or e2e step that a document saved under the old key loads and is saved under the new one, and `pnpm test:e2e` passes
