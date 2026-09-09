# Notes

- The name went from Drawing to Drafter; Draft was tried first and read like an instruction in prose.
- Packages: `@bitmachina/drafter`, `@bitmachina/drafter-kit`, `@bitmachina/drafter-docs`. The lockfile was refreshed with `pnpm install`.
- Storage keys are `drafter.*`. A model found only under `drawing.document.v1` is loaded and written under the new key at once, so a reload without any edit already has it in the new place. The theme and display preferences fall back to their defaults rather than migrating.
- Verification: `pnpm typecheck`, `pnpm test` (252), `pnpm kit:test` (28), `pnpm build`, `pnpm docs:build`, `pnpm kit:build`, and `pnpm test:e2e` (21, including the old key fallback) pass.
