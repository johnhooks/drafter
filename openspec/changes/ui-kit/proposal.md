## Why

The panels around the drawing surfaces (toolbar, timeline, properties, notices, confirmations) are hand-rolled with ad hoc CSS. They work, but every new control is styled from scratch, keyboard and screen-reader behaviour is whatever the browser gives a bare element, and there is no place to look at a control on its own. A component library of our own, built on an accessible unstyled foundation and documented in Storybook, gives later user interface work one consistent vocabulary.

## What Changes

- A new workspace package `packages/kit` exporting styled components built on React Aria Components.
- One visual language, deliberately minimal: flat mid-grey panels, one-pixel lines a shade darker than their fill, small dense type, a single accent colour, no shadows or gradients. A fixed set of semantic tokens is the single source of colours, type, spacing, and radii.
- Themeable from the start. A theme is one block that assigns the semantic tokens, selected by a `data-theme` attribute on any ancestor. Two themes ship: the light grey default and a dark theme, and Storybook can switch between them for every story.
- Storybook for the package with a Foundations story (tokens) and a story per component, with an accessibility addon.
- Unit tests for component behaviour with Vitest and Testing Library.
- The app is not migrated in this change. It keeps its current panels; a later change moves them onto the kit.

Components in this first version, chosen from what the application panels use today: Button, ToggleButton, ToggleButtonGroup, Toolbar, TextField, NumberField, Select, Checkbox, ListBox, Menu, Dialog, Toast, Tooltip, Disclosure, and the layout primitives Panel, Field, and Row.

Not in this change: a theme editor or user-defined themes, icons beyond a small inline set, data tables, drag and drop, migration of the app.

## Capabilities

### New Capabilities
None. A component library has no application behaviour of its own; behaviour specs arrive with the change that migrates the app onto it.

### Modified Capabilities
None.

## Impact

- New package with its own dependencies: react-aria-components, Storybook, Testing Library. The app's bundle is untouched until it imports the kit.
- `pnpm-workspace.yaml` gains `packages/*`; root scripts `kit:storybook`, `kit:build`, `kit:test`.
- A Development page in the documentation site describing the kit and how to add a component.
