## 1. Camera from state

- [ ] 1.1 Derive the camera from `view.camera`, enable rotation on right or Alt drag, write changes back through a throttled `setView`, clamp elevation; verify e2e that a right-drag changes azimuth in the stored view and left click still picks a face
- [ ] 1.2 Implement the ten canonical views, nearest-view snap within 8 degrees, and the eased move; verify unit tests for nearest-view selection and threshold, and e2e for a near-front release settling exactly and an off-view release staying

## 2. Cube, keys, shading

- [ ] 2.1 Add the view cube bound to the canonical views; verify e2e that clicking the top face yields elevation 90
- [ ] 2.2 Add keys 1 to 6, Home, and F with input skipping and the fit computation; verify e2e for a key view and for F bringing an off-screen body into view
- [ ] 2.3 Switch body shading to camera-relative lighting; verify by screenshot that the default view keeps its tones and the back view shows depth

## 3. Tests and docs

- [ ] 3.1 Replace the hard-coded isometric projection in e2e helpers with a camera-aware `screenPoint`; verify the full e2e suite passes including a face pick from the back view
- [ ] 3.2 Update the docs Run It layout note, the Tools page navigation table, and What It Is (the fixed angle line); verify `pnpm docs:build`
- [ ] 3.3 Verify `pnpm test`, `pnpm test:e2e`, `pnpm build` pass and record results in a notes file in the change directory
