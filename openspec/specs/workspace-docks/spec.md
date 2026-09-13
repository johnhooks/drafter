# workspace-docks Specification

## Purpose

Provides configurable side docks that keep modelling controls accessible while reserving an unobstructed canvas with predictable bounds.

## Requirements

### Requirement: Fixed dock containers
The workspace SHALL have a left dock, a central canvas, and a right dock below the application toolbar. Each dock SHALL own a common width for its panels and a control strip distinct from inner panel headers. Single thin boundary lines SHALL distinguish the canvas, docks, and toolbar. Docks SHALL NOT overlay the canvas. Panel visibility controls SHALL live in the docks rather than duplicate top-navigation controls. Dock and panel grouping SHALL NOT introduce tabs.

#### Scenario: Resize a dock
- **WHEN** the user drags a dock's canvas-facing edge
- **THEN** its panels share the new width, the canvas takes the remaining width, and neither dock covers the canvas

#### Scenario: Fit after a layout change
- **WHEN** the user invokes the existing fit action after resizing or collapsing a dock
- **THEN** fitting uses the actual central viewport bounds and centers within that space
- **AND** moving or resizing a panel alone does not trigger a fit action

### Requirement: Movable panel identity
Each panel SHALL have a stable identity, title, and distinct icon. Dragging its title SHALL reorder it within a dock or move it to an insertion position in the other expanded dock. Panels SHALL pack together vertically without free-floating gaps. Movement SHALL preserve panel identity and folded state, and SHALL NOT modify the document, selection, or document undo history. Cancelled movement SHALL preserve the arrangement.

#### Scenario: Move Selection to the left
- **WHEN** the user moves Selection before Model in the left dock
- **THEN** Selection occurs once at that position and is removed from its former dock
- **AND** its icon follows the panel into the left dock's collapsed rail

#### Scenario: Cancel movement
- **WHEN** a panel drag is cancelled with Escape
- **THEN** the panel remains in its original position

### Requirement: Bounded height allocation
Panel headers SHALL stay outside their scrolling content. Dividers SHALL transfer height between neighboring expanded panels, with limits that preserve usable content space. Panel content growth or selection changes SHALL NOT change the allocation. Window resizing SHALL constrain the stack to the available height; content SHALL scroll within its panel rather than pushing panel controls below the workspace. Double-clicking a divider SHALL restore the default allocation for its dock.

#### Scenario: Resize with long content
- **WHEN** the user grows Selection by dragging its divider while a neighboring panel has a long list
- **THEN** Selection gains the height the neighbor loses until the minimum is reached
- **AND** the dock stays within the workspace and the list scrolls inside its remaining space

#### Scenario: Shorter window
- **WHEN** the workspace becomes shorter than the saved expanded sizes
- **THEN** displayed heights shrink to fit while all panel headers remain reachable
- **AND** a later increase in workspace height restores the preferred allocation

### Requirement: Independent panel folding
A disclosure chevron SHALL fold a panel to its title bar or reopen it. Folding SHALL release content space to other expanded panels without changing their folded states. Reopening SHALL restore the panel's preferred allocation subject to available space. When all panels are folded, their headers SHALL remain packed at the top.

#### Scenario: Fold and reopen
- **WHEN** the user folds Selection and later reopens it
- **THEN** its content disappears and returns, other panels retain their folded states, and the document selection is unchanged

### Requirement: Collapsed dock icon rails
Collapsing a dock SHALL retain an edge control to reopen the full arrangement and one named icon for each available panel in current order. Activating a panel icon SHALL open that panel and temporarily fill its dock in one action, even if the panel was folded. Icons SHALL have tooltips and accessible names, and panel identity icons SHALL differ from layout action icons.

#### Scenario: Direct access to a folded panel
- **WHEN** Selection was folded before its dock was collapsed and the user activates its rail icon
- **THEN** the dock opens with Selection visible and filling its content area without a second click
- **AND** restoring the arrangement returns Selection to its prior folded state

#### Scenario: Reopen the full dock
- **WHEN** the user activates the collapsed dock's edge control
- **THEN** its previous arrangement returns, including panel order, sizes, and folded states

### Requirement: Temporary fill and restore
An inner panel header SHALL provide a fill-dock action using an outward-corner icon. While filled, the same control location SHALL show an inward-corner restore icon. Restoring SHALL reinstate the prior order, preferred sizes, and folded states. There SHALL NOT be a duplicate restore action on the dock frame. Changing selection SHALL NOT end fill mode. Moving a panel SHALL end fill mode before applying the move.

#### Scenario: Restore from the initiating control
- **WHEN** the user fills the dock with Selection and activates its restore control
- **THEN** the previous layout returns and the control becomes the fill action in the same position

### Requirement: Accessible workspace controls
Panel movement SHALL support pointer and keyboard operation with destination feedback and cancellation. Resize separators SHALL be focusable, named, and expose orientation and current value; arrow keys SHALL adjust sizes in steps. Controls that hide their focused content SHALL return focus to a visible controlling element. Layout actions SHALL NOT invoke modelling shortcuts while handled by a focused layout control.

#### Scenario: Keyboard move and resize
- **WHEN** the user starts a panel move with Enter, navigates to a destination with Tab, and confirms with Enter
- **THEN** the panel moves and the result is announced
- **AND** a focused divider can subsequently be resized with its orientation's arrow keys

### Requirement: Workspace preferences
Dock widths, collapsed states, panel order, panel folded states, and preferred height allocations SHALL be remembered in browser preferences across reloads and documents. Temporary fill mode SHALL NOT replace the saved normal arrangement. Invalid or legacy preferences SHALL fall back safely to usable defaults. Layout preferences SHALL NOT appear in document files or document undo history; unavailable storage SHALL leave session interactions usable. Contextually unavailable panels SHALL retain their saved placement for when they return.

#### Scenario: Reload the workspace
- **WHEN** the user moves a panel, resizes a dock, folds a panel, and reloads
- **THEN** the normal workspace arrangement is restored, constrained to the current viewport

#### Scenario: Older layout data
- **WHEN** saved preferences contain only the earlier Selection pane height or malformed layout data
- **THEN** the new workspace opens with a valid default arrangement and the document still loads

#### Scenario: Switch editing context
- **WHEN** a sketch-only panel becomes unavailable in another editing context and the user returns to that sketch
- **THEN** the panel returns to its saved dock and position without displacing the other saved panel identities

#### Scenario: Model view with a selected sketch
- **WHEN** the user views the model with a sketch feature selected
- **THEN** the context properties panel may show the sketch feature settings and an Edit sketch action
- **AND** Sketch entities and sketch Selection are unavailable until the user enters the sketch editor
