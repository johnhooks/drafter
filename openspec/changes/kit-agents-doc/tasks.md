## 1. Write the guide

- [x] 1.1 Write `packages/kit/AGENTS.md` covering the visual language, the rules, the idioms (icon toggle clusters for view state, commit-on-blur fields, hover row actions, ListBox detail slot), and the commands, kept under a screen of text; verify it names every rule the kit's tests enforce (token-only stylesheets, theme token parity)
- [x] 1.2 Add `packages/kit/CLAUDE.md` containing `@AGENTS.md`, and replace the root `CLAUDE.md` symlink with a file containing `@AGENTS.md`; verify both are regular files whose content is that one line and that `git status` shows the root change as a type change
- [x] 1.3 Link the guide from the Develop UI Kit page; verify `pnpm docs:build`
