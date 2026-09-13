## Why

The properties column forces sketch settings, lists, and selection details to compete for space, with nested disclosures obscuring the selected object's fields. The stacked-dock exploration establishes a configurable workspace with predictable sizing and direct access to each panel.

## What Changes

- Replace fixed sidebars with left and right docks surrounding an unobstructed canvas. Each dock owns its width and controls; thin single boundaries distinguish it from the canvas and toolbar.
- Allow panels to move within and between docks, resize vertically, and collapse individually. Keep headers accessible and scroll content within allocated space.
- Collapse a dock to a rail containing its panels' distinct icons in their current order. One click opens a panel, including one previously folded.
- Let a panel temporarily fill its dock, with matching outward/inward corner controls in the same inner-header position and restoration of the previous arrangement.
- Keep dock controls on the docks, without duplicate top-navigation controls or tabs. Support pointer and keyboard interactions.
- Make sketch Selection an independent panel, show primary fields directly, and explicitly inspect selected constraints. Offer parent-rectangle navigation instead of automatically stacking the rectangle and line forms.
- Persist workspace layout separately from documents, with safe fallback for older layout data. Retain existing feature, sheet, parameter, and geometry editing behavior.

## Capabilities

### New Capabilities
- `workspace-docks`: Dock framing, panel identity, movement, bounded sizing, collapse, icon rails, temporary maximization, persistence, and accessible controls.

### Modified Capabilities
- `sketch-editor`: Replace the fixed Selection pane arrangement with independent dock panels and direct selection inspection.
- `sketch-rectangles`: Replace automatic parent-rectangle forms for individual member lines with explicit parent navigation.

## Impact

Application composition in `src/ui/App.tsx`, `PropertiesColumn.tsx`, `Properties.tsx`, layout CSS and browser preferences; reusable kit presentation and React Aria drag/drop hooks; Storybook workspace examples; affected UI tests and user documentation. No document schema, core geometry, deployment, or API changes. The active `extrude-offset` change remains separate; its property fields must continue to work inside the new shell.
