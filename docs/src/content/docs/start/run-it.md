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

- **Toolbar** across the top: undo and redo, then the buttons for the current mode. In the model view, New sketch and Pick face; while sketching, the tool switcher, Dims, Extrude, and Finish. The menu at the far right holds export, download, open, new document, and the theme.
- **Timeline** on the left: every sketch and extrude in order, with an error mark on any that failed.
- **View** in the centre: the 3D model, or the sketch you are editing. Right-drag orbits the model; a view cube in the corner jumps to any side.
- **Properties** on the right: the selected feature, or the document and its parameters when nothing is selected.
- **Warnings** below the view whenever a feature fails to evaluate. Refusals and errors also appear as notices at the top of the view until you dismiss them.

## Theme

The panels come in a light grey and a dark theme. Choose one from the menu at the right of the toolbar; the choice is remembered in the browser. The sketch and 3D surfaces keep their own colours.
