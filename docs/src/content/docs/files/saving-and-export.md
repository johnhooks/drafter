---
title: Saving and Export
description: Where your work lives and how to get it out.
sidebar:
  order: 1
---

## Autosave

The file, model and view, is saved to the browser's local storage after every change and restored when you open the app again, including the camera position and whichever sketch you were editing. This is per browser and per machine. If storage is unavailable, or what it holds cannot be read, the app starts a new document and tells you.

**New document**, in the toolbar menu, replaces the current document after a confirmation.

## JSON

**Download JSON** in the toolbar menu saves the document as a file named after its title. **Open JSON** replaces the current document with a file. A file that fails validation is refused with the reasons listed, and the current document is left as it was. Files from earlier versions of the format are converted on open.

The file holds the model and the view. Bodies are recomputed when the file opens; the camera and the open sketch are restored, so a file opens where its author left it. A file saved without a view opens at the default view.

## SVG and PNG

While editing a sketch, **Export SVG** downloads the sketch view as a standalone file with its rectangles, dimensions, and reference faces. In the model view, **Export PNG** downloads the current 3D rendering at screen size.
