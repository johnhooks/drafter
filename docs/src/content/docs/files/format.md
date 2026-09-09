---
title: File Format
description: The JSON document layout, for reading or generating files outside the app.
sidebar:
  order: 2
---

A file is JSON with a version and two parts. `model` is what you built: a title, parameters, and an ordered list of features. `view` is how you were looking at it: the camera and the sketch that was open, if any. Undo covers the model only; the view is saved but never undone. Every length is a whole number of sixteenths, or a string holding an expression.

```json title="document.json"
{
  "version": 3,
  "model": {
  "title": "Block",
  "params": [{ "name": "ply", "value": "3/4" }],
  "features": [
    {
      "kind": "sketch",
      "id": "s_a1",
      "handle": "s1",
      "name": "Sketch 1",
      "plane": { "kind": "principal", "plane": "XZ", "offset": 0, "normal": -1 },
      "rects": [{ "id": "r_b2", "handle": "r1", "u": { "min": 0, "max": 384 }, "v": { "min": 0, "max": 384 } }]
    },
    { "kind": "extrude", "id": "e_c3", "name": "Extrude 1", "sketchId": "s_a1", "rectIds": ["r_b2"], "distance": 384, "op": "new" },
    {
      "kind": "sketch",
      "id": "s_d4",
      "handle": "s2",
      "name": "Sketch 2",
      "plane": { "kind": "face", "featureId": "e_c3", "rectId": "r_b2", "face": "vMax" },
      "rects": [{ "id": "r_e5", "handle": "r1", "u": { "min": "face.left + 2", "max": "face.right - 2" }, "v": { "min": -352, "size": 64 } }]
    },
    { "kind": "extrude", "id": "e_f6", "name": "Extrude 2", "sketchId": "s_d4", "rectIds": ["r_e5"], "distance": "-(ply)", "op": "cut", "targetBodyId": "e_c3" }
  ]
  },
  "view": {
    "camera": { "azimuth": -45, "elevation": 35.264, "zoom": 6, "center": [0, 0, 0] },
    "sketchId": "s_d4"
  }
}
```

## Fields

- **plane** is `principal` with `plane` XZ, XY, or YZ, an `offset` along the normal axis, and a `normal` of 1 or -1; or `face` with the id of the extrude that made the box, optionally the rectangle id within it, and which face: `cap`, `base`, `uMin`, `uMax`, `vMin`, `vMax`. The cap is the far end of the extrusion.
- **rects** store exactly two of `min`, `max`, `size` per axis. A number is sixteenths; a string is an expression.
- **distance** is signed: positive along the plane normal. An expression against the normal is written `-(expr)`.
- **op** is `new`, `join`, or `cut`; `join` and `cut` carry `targetBodyId`, which is the id of the extrude that created the body.
- Ids are opaque and unique; handles are the short names expressions use.

- **view.camera** is the orbit azimuth and elevation in degrees, the orthographic zoom in pixels per inch, and the centre the camera looks at in sixteenths. **view.sketchId** names the sketch that was open, so the file reopens there.

Version 1 files, which stored rectangles as two corners, and version 2 files, which had no view, open and are rewritten as version 3 on save.
