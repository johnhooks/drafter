# Notes

Date: 2026-09-08

The toolbar, timeline, properties, parameters, confirmations, and notices now
come from `@drawing/kit`. The sketch editor and 3D view are untouched. The app
stylesheet holds layout and the drawing surfaces only.

Verification: `pnpm test` (196), `pnpm test:e2e` (8 tests across four specs, all
selectors moved to roles and labels), `pnpm kit:test` (26), `pnpm typecheck`,
`pnpm build`, `pnpm docs:build`. Screenshots of the full flow in both themes were
reviewed.

## Observations

- Toasts are fed from the store's notices; closing a toast releases the notice so
  the same message can appear again later. Errors and refusals do not time out.
- The theme attribute is set on the root element, not a wrapper, because React
  Aria portals popovers and dialogs to the body and they must be themed too.
- Playwright cannot check a React Aria checkbox directly (its input is visually
  hidden); tests click the label. A kit Select's trigger is named by its value
  and then its label, so tests match the label at the end of the name.
- Row actions only render on hover, so tests hover the row before clicking.
- Parameter add uses Enter to commit each field before pressing Add, because a
  kit TextField commits on blur and the Add button is disabled until then.
