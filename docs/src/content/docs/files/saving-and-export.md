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

The file holds the model, the view, and any drawing sheets. Bodies, sheet projections, and isometric images are recomputed when the file opens; the model camera and the open sketch are restored. Sheet settings, order, dimensions, and notes are preserved, but the active sheet and its page zoom are not saved. A file saved without a view opens at the default model view.

Each isometric sheet saves the camera azimuth and elevation captured when its creation was confirmed, without the model viewport's pan or zoom. Its image is regenerated from that orientation at the stored scale, centred on its target without refitting; rendered pixels are not stored in JSON. Moving the model camera does not alter the saved sheet orientation. Isometric note leaders retain their paper-inch coordinates through scale edits and reopening. Sheet views remain read-only after reopening, including orthographic views in older files.

## SVG and PNG

While editing a sketch, **Export SVG** downloads the sketch view as a standalone file with its lines, regions, constraints, and reference faces, drawn in the colours of the current theme over a background in the canvas colour, so it reads as it did on screen. In the model view, **Export PNG** downloads the current 3D rendering at screen size.

In Sheets mode, **Export sheet as SVG** downloads the selected drawing page sized in inches, including its title block and annotations. Orthographic sheets use black-on-white line drawings; detached dimensions retain their orange warning colour. Isometric sheets embed a 300 DPI PNG as a data URL inside the SVG, alongside their notes and selected ratio in the title block, so no external image file is needed. **Print Sheet**, **Print All**, and the browser's Print command preserve that ratio independently of viewport zoom. Print at 100%: a 24" edge parallel to the camera plane occupies 6" at 1:4 or 3" at 1:8. Oblique edges remain foreshortened. See [Drawing sheets](/drawings/sheets/) for annotations, scale, and page-orientation settings.
