---
title: Testing
description: Unit tests on the core and store, end-to-end tests through the browser.
sidebar:
  order: 2
---

```shell
pnpm test        # Vitest
pnpm test:e2e    # Playwright
pnpm typecheck
pnpm build
```

## Unit tests

Vitest covers the core and the store actions. Geometry tests assert on volume, bounds, and faces rather than on the internal list of boxes, because a disjoint decomposition is not unique. Expression tests are table driven. The integration test builds a parametric part from parameters and constraints and changes them.

## End-to-end tests

Playwright drives the app in headless Chromium with software rendering so the 3D view works. The dev server is started on port 5199 by the Playwright config. Tests read application state through a debug hook that exists only in development builds.

Two things to know when writing them: the 3D canvas reports its default size for a frame after switching modes, so wait for its real size before computing click positions; and Playwright will not click a zero-height SVG line, so select constraints through their labels.
