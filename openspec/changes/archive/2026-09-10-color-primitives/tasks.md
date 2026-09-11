## 1. Tokens

- [x] 1.1 Add the primitive colours to `tokens.css` and point every role at one; rewrite `light.css` and `dark.css` as role-to-primitive assignments; verify `pnpm kit:test`
- [x] 1.2 Rewrite `test/tokens.test.ts` to enforce the tiers: values only on primitives, every reference resolves, no primitive in a theme, every theme covers every role; verify `pnpm kit:test`

## 2. Docs and wrap up

- [x] 2.1 Describe the two tiers in `packages/kit/AGENTS.md` and the ui-kit docs page; verify `pnpm docs:build`
- [x] 2.2 Verify `pnpm kit:test`, `pnpm kit:build`, `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm build`, `pnpm docs:build` pass and record results in a notes file
