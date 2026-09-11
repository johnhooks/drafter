---
title: UI Kit
description: The component library the panels are built from, its tokens and themes, and how to add a component.
sidebar:
  order: 3
---

`packages/kit` is the project's component library. It is built on React Aria Components, which supply behaviour, accessibility, and keyboard handling; every visual decision is the kit's own and comes from one set of tokens. The rules and idioms below are kept current in `packages/kit/AGENTS.md`, which is the file to read before changing the kit.

```shell
pnpm kit:storybook   # browse components at http://localhost:6006
pnpm kit:test        # Vitest with Testing Library
pnpm kit:build       # static Storybook
```

## Tokens

Components style themselves only through custom properties prefixed `--kit-`, named for their role: `--kit-surface-panel`, `--kit-line`, `--kit-text-muted`, `--kit-accent`, and so on, plus the type scale, a 4 px spacing unit, a 2 px radius, and control and row heights. A test fails if a component stylesheet contains a literal colour.

Colours come in two tiers. Primitives, `--kit-color-grey-400`, `--kit-color-amber-500`, `--kit-color-violet-500`, are the only place a colour value is written, one per hue and weight. Roles point at a primitive: `--kit-accent: var(--kit-color-amber-400)`. A theme reassigns roles to other primitives and never writes a value, so a hue is defined once and can be reached for by name wherever a new role needs it.

The sketch canvas has its own set, `--kit-canvas-*`: the surface, the grid's axis and major and minor lines, geometry and construction lines, handles, selection and hover, region fills, constraints, anchors, the link highlight, errors, and reference geometry. The canvas resolves them to values once per theme and writes those values into the SVG it draws, so an exported sketch carries real colours rather than references to a stylesheet. A test in the application checks that the canvas names every token the kit defines and no other.

The look is flat: panels a step lighter than the frame, controls a step lighter than panels, one-pixel lines a step darker than the surface they sit on, no shadows or gradients. Text is 11 px, field values 12 px, section labels 10 px upper case and letter-spaced. Selection and the active tool use the one accent colour.

## Themes

A theme is a stylesheet that assigns the colour tokens under `[data-theme="name"]`. Two ship, `light` and `dark`. Put `data-theme` on the root element to theme the page, or on any element to theme a subtree. `ThemeProvider` and `useTheme` are conveniences for a switcher; they are not required. A test fails if a theme misses a token the other defines. Storybook's toolbar switches every story between themes.

A consumer imports three stylesheets once: `@bitmachina/drafter-kit/tokens.css`, `@bitmachina/drafter-kit/base.css`, and a theme.

## Icons

Icons come from Lucide, rendered at 14 px with a 1.5 px stroke in `currentColor`. The smallest cells (row actions, steppers, chevrons, toast dismiss) use the kit's own 12 px glyphs so they stay crisp. `Icon` maps a name to either; nothing outside the kit imports an icon library.

## Components

| Component | Use |
| --- | --- |
| `Icon`, `IconButton` | Inline icons and icon-only controls. Text never stands in for an icon; an icon-only control is always an `IconButton` with a label |
| `Button`, `ToggleButton`, `ToggleButtonGroup`, `Toolbar` | Toolbars and tool switchers |
| `TextField` | Names and lengths. Commits on Enter or blur, reverts on Escape, takes a `validate` function so the application's own parser decides what is valid |
| `NumberField` | Plain numbers with steppers |
| `Select`, `Checkbox` | Options and flags |
| `ListBox` | Selectable rows with a detail slot and trailing actions: timeline, lines, regions, constraints |
| `Menu` | Popup actions |
| `Dialog`, `ConfirmDialog` | Modal questions |
| `ToastRegion`, `toast()` | Notices |
| `Tooltip` | Hints on hover and focus |
| `Disclosure` | Collapsible sections |
| `Panel`, `Fields`, `Row`, `Field`, `Hint` | Layout |

## Add a component

1. Create `src/components/Name/` with `Name.tsx`, `Name.css`, `Name.stories.tsx`, and `Name.test.tsx`.
2. Build on the matching React Aria component and style through its data attributes: `[data-hovered]`, `[data-pressed]`, `[data-selected]`, `[data-focus-visible]`, `[data-disabled]`.
3. Use only tokens in the stylesheet.
4. Write a story per meaningful state and a test for the keyboard behaviour.
5. Export it from `src/index.ts`.
