---
title: Run It
description: Install dependencies and start the app locally.
sidebar:
  order: 2
---

Drawing is a static web app. It needs Node 22 or later and pnpm.

```shell
pnpm install
pnpm dev
```

Open the address Vite prints, normally `http://localhost:5173`. There is no server component and no account; the app runs entirely in the browser tab.

## Build for hosting

```shell
pnpm build
```

The `dist/` folder is a static site. Serve it from any web server or open it from a local file server.

## Screen layout

- **Toolbar** across the top. Its buttons change with the mode: model view or sketch editing.
- **Timeline** on the left: every sketch and extrude in order, with an error mark on any that failed.
- **View** in the centre: the 3D model, or the sketch you are editing.
- **Properties** on the right: the selected feature, or the document and its parameters when nothing is selected.
- **Warnings** below the view whenever a feature fails to evaluate.
