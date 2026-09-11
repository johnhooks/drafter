# Notes

## Verification

- `pnpm kit:test`: 29, including the new tier tests. `pnpm kit:build` renders every story.
- `pnpm test`: 281. The canvas palette test is unchanged; computed style substitutes the `var()` chain so each role still reads as a literal.
- `pnpm test:e2e`: 27. The theme spec confirms the canvas still follows the theme and the export carries literal values, not references.
- `pnpm typecheck`, `pnpm build`, `pnpm docs:build`: clean.

## Decisions made during implementation

- The canvas error red `#b3261e` and the panel danger `#b8321f` were the same intent a hair apart; they share `--kit-color-red-600` now. Every other value is unchanged.
- Twenty grey steps, because the panel ladder and the canvas greys each had deliberate steps and this change does not tune the look.
