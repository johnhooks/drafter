# Notes

Date: 2026-09-08

`packages/kit` holds the component library: 15 components on React Aria
Components, a Foundations story, a story per component state, and Vitest tests
for keyboard and commit behaviour. Two themes (light, dark) assign one semantic
token set; tests fail on a literal colour in a component stylesheet or on a theme
that misses a token. Storybook's toolbar switches every story between themes.

Verification: `pnpm kit:test` (22 tests), `pnpm --filter @drawing/kit typecheck`,
`pnpm kit:build` (static Storybook), `pnpm test` and `pnpm test:e2e` for the app
with the kit tokens imported, `pnpm build`, `pnpm docs:build`.

## Observations

- Storybook is at version 10, not the 9 named in the design; the setup is the same.
- React Aria exposes single-selection toggle buttons as radios and appends the
  field label to stepper button names ("Increase Zoom"); tests query accordingly.
- Menu `onAction` receives a second argument; tests check the first.
- The TextField's Escape revert blurs the input; a ref guards the blur commit
  from reading the stale draft.
- pnpm 11 needs `allowBuilds` in `pnpm-workspace.yaml` for esbuild and sharp.
- The app keeps its own panels. Its stylesheet now maps its colour names onto the
  kit tokens and sets `data-theme="light"` on the root, so the greys and accent
  already match; the visible change is the mid-grey frame and the accent for
  active buttons.
