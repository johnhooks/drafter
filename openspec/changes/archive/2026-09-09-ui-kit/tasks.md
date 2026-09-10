## 1. Package and Storybook

- [x] 1.1 Create `packages/kit` with react-aria-components, add `packages/*` to the workspace, root scripts `kit:storybook`, `kit:build`, `kit:test`; verify `pnpm install` and an empty `pnpm kit:test` run
- [x] 1.2 Add Storybook 9 (react-vite) with the accessibility addon and a preview that imports `tokens.css` and `base.css`; verify `pnpm kit:storybook` serves and `pnpm kit:build` builds

## 2. Foundations

- [x] 2.1 Write `tokens.css` (semantic colour tokens with light fallbacks, type scale, spacing, radius, control and row heights), `base.css`, and `themes/light.css` and `themes/dark.css`; verify the Foundations story shows swatches, type scale, and spacing in both themes
- [x] 2.2 Add `ThemeProvider` and `useTheme`, and a Storybook toolbar control that switches `data-theme` on the preview; verify a story renders in both themes
- [x] 2.3 Add tests that no component stylesheet contains a literal colour and that both theme files assign the same token set; verify both pass

## 3. Controls

- [x] 3.1 Button and ToggleButton with variants primary, default, and quiet, and a danger tone; stories for each state; verify tests for click, disabled, and pressed state
- [x] 3.2 ToggleButtonGroup and Toolbar; verify tests for single selection and arrow-key movement
- [x] 3.3 TextField with label, description, error, `validate`, and `onCommit` on Enter and blur with Escape reverting; NumberField; verify tests for commit, revert, and invalid state
- [x] 3.4 Select and Checkbox; verify tests for keyboard selection and the checked state

## 4. Collections and overlays

- [x] 4.1 ListBox with primary text, secondary text, a trailing actions slot, single and multiple selection, and an error tone per item; verify tests for selection with mouse and keyboard
- [x] 4.2 Menu with MenuTrigger and sections; verify tests for opening with keyboard and choosing an item
- [x] 4.3 Dialog with a confirm helper (title, body, confirm and cancel labels, danger tone); verify tests for Escape and confirm
- [x] 4.4 Toast region and a `toast()` function with dismiss; Tooltip on any trigger; verify tests for dismiss and for tooltip on focus

## 5. Layout

- [x] 5.1 Panel with a header slot, Field (label above control, error below), Row (horizontal group with gap), and Disclosure; verify stories compose a properties panel that mirrors the app's rectangle properties

- [x] 5.2 Add `Icon` (Lucide plus 12 px micro glyphs) and `IconButton`, and replace every text glyph in the kit (close, chevrons, steppers, checkbox mark); verify stories for both and tests for labelling and press

## 6. Wrap up

- [x] 6.1 Import the kit's tokens and light theme into the app stylesheet so the app's greys and accent match; verify the app builds and the end-to-end tests still pass
- [x] 6.2 Add a Development page to the documentation site describing the kit, the tokens, and how to add a component with a story and a test; verify `pnpm docs:build` passes
- [x] 6.3 Verify `pnpm kit:test`, `pnpm kit:build`, `pnpm test`, `pnpm build` all pass and record the result in a notes file in the change directory
