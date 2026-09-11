## Context

Roles were declared with hex values in `tokens.css` and restated per theme. The sketch canvas resolves its roles with `getComputedStyle`, which substitutes `var()` chains, so a role that points at a primitive still reads as a literal. See proposal.md.

## Decisions

**Primitives keep every existing value.** The grey ladder names each step by approximate lightness, 50 to 1000, so the panel ladder and the canvas greys read as one scale. Values were not tuned; near-duplicates that were the same intent (the canvas error and the panel danger) collapsed to one primitive, the rest kept their own step.

**Translucent fills are primitives too.** `color-mix()` or relative colour syntax would leave the computed custom property unresolved, and the canvas writes the value into SVG attributes and export files. So each alpha fill is a named primitive with an rgba value.

**Themes reassign roles, never primitives.** A theme is a list of role-to-primitive lines. The test refuses a primitive in a theme file, so a dark variant of a hue is a second primitive weight, not a redefinition.

**Roles are recognised by shape, not name.** The theme-coverage test treats any non-primitive token whose value is a single `var(--kit-color-…)` as a colour role, replacing the name allowlist and the value-classification that preceded it.

## Risks / Trade-offs

- [Twenty grey steps is many] → They are the steps the panels and canvas already used; collapsing them would change the look, which this change does not do. A later tuning pass can merge steps.
