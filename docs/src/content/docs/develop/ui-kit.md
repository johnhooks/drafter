---
title: UI Kit
description: The component library the panels are built from, its tokens and themes, and how to add a component.
sidebar:
  order: 3
---

`packages/kit` is the project's component library. It is built on React Aria Components, which supply behaviour, accessibility, and keyboard handling; every visual decision is the kit's own and comes from one set of tokens.

```shell
pnpm kit:storybook   # browse components at http://localhost:6006
pnpm kit:test        # Vitest with Testing Library
pnpm kit:build       # static Storybook
```

## Tokens

Components style themselves only through custom properties prefixed `--kit-`, named for their role: `--kit-surface-panel`, `--kit-line`, `--kit-text-muted`, `--kit-accent`, and so on, plus the type scale, a 4 px spacing unit, a 2 px radius, and control and row heights. A test fails if a component stylesheet contains a literal colour.

The look is flat: panels a step lighter than the frame, controls a step lighter than panels, one-pixel lines a step darker than the surface they sit on, no shadows or gradients. Text is 11 px, field values 12 px, section labels 10 px upper case and letter-spaced. Selection and the active tool use the one accent colour.

## Themes

A theme is a stylesheet that assigns the colour tokens under `[data-theme="name"]`. Two ship, `light` and `dark`. Put `data-theme` on the root element to theme the page, or on any element to theme a subtree. `ThemeProvider` and `useTheme` are conveniences for a switcher; they are not required. A test fails if a theme misses a token the other defines. Storybook's toolbar switches every story between themes.

A consumer imports three stylesheets once: `@drawing/kit/tokens.css`, `@drawing/kit/base.css`, and a theme.

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
| `ListBox` | Selectable rows with a detail slot and trailing actions: timeline, rectangles, constraints |
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
