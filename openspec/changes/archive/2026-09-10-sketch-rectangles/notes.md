# Notes

## Verification

- `pnpm typecheck`, `pnpm build`, `pnpm docs:build`: clean.
- `pnpm test`: 259 tests. Rectangle records in validation, expression aliases, dependency mapping, migration to version 5 (3 to 5 direct, 4 bumped), and the store actions for add, explode, group, the form, and dissolve.
- `pnpm test:e2e`: 23 tests, including `rectangles.spec.ts`: the named row in the shape list, the form on a member line, Width by number and by expression, Left moving one line, Explode, Make rectangle on the regrouped lines and on a drawn chain, and a version 3 file keeping `r1.right + 1`.

## Decisions made during implementation

- Explode and dissolve rewrite every expression that named the rectangle to the equivalent over its lines (`r1.right` to `l3.at`, `r1.width` to `(l3.at - l1.at)`) before the record goes. Without this a Width typed as `r1.height * 2` broke on Explode. Added to the spec.
- Group accepts an end attached to a line collinear with the member it should meet, since that holds the corner just as well. The Line tool attaches to the first perpendicular line in sketch order, which can be an older collinear line. Added to the spec.
- Rectangle handles follow the same rule as lines: one past the highest in use. After exploding the only rectangle, the next one is `r1` again.
- The shape list names a region by a rectangle only when the region is exactly that rectangle's area; a split rectangle shows two regions and keeps its record and form. The match checks every line at the region's corner, not only the canonical one, because adjacent rectangles share corner lines and the migrated cabinet file showed every row as Region until this was fixed (`regionIsRectangle` in `regions.ts`).

## Loading the version 3 backup

Open `2219_Enterprise.json` through Open JSON. It becomes version 5 with `r1` to `r15` and every expression as written. Then, in the Cabinets sketch, select the inner region (r13) and add it to Extrude 2, which the migration left as the ring around it; Extrude 10 then cuts as intended.
