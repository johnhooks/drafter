---
title: File Format
description: The JSON document layout, for reading or generating files outside the app.
sidebar:
  order: 2
---

A file is JSON with a version and two parts. `model` is what you built: a title, parameters, and an ordered list of features. `view` is how you were looking at it: the camera and the sketch that was open, if any. Undo covers the model only; the view is saved but never undone. Every length is a whole number of sixteenths, or a string holding an expression.

```json title="document.json"
{
  "version": 4,
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
        "lines": [
          { "id": "l_b1", "handle": "l1", "dir": "v", "at": 0, "run": { "min": "l2.at", "max": "l4.at" } },
          { "id": "l_b2", "handle": "l2", "dir": "h", "at": 0, "run": { "min": "l1.at", "max": "l3.at" } },
          { "id": "l_b3", "handle": "l3", "dir": "v", "at": 384, "run": { "min": "l2.at", "max": "l4.at" } },
          { "id": "l_b4", "handle": "l4", "dir": "h", "at": 384, "run": { "min": "l1.at", "max": "l3.at" } }
        ]
      },
      { "kind": "extrude", "id": "e_c3", "name": "Extrude 1", "sketchId": "s_a1", "regions": [{ "vertical": "l_b1", "horizontal": "l_b2" }], "distance": 384, "op": "new" },
      {
        "kind": "sketch",
        "id": "s_d4",
        "handle": "s2",
        "name": "Sketch 2",
        "plane": { "kind": "face", "featureId": "e_c3", "region": { "vertical": "l_b1", "horizontal": "l_b2" }, "face": "side", "lineId": "l_b4", "outward": 1 },
        "lines": [
          { "id": "l_e1", "handle": "l1", "dir": "v", "at": "face.left + 2", "run": { "min": "l2.at", "max": "l4.at" } },
          { "id": "l_e2", "handle": "l2", "dir": "h", "at": -352, "run": { "min": "l1.at", "max": "l3.at" } },
          { "id": "l_e3", "handle": "l3", "dir": "v", "at": "face.right - 2", "run": { "min": "l2.at", "max": "l4.at" } },
          { "id": "l_e4", "handle": "l4", "dir": "h", "at": "l2.at + 4", "run": { "min": "l1.at", "max": "l3.at" } }
        ],
        "regionLabels": { "l_e1|l_e2": { "width": { "offset": 48 } } }
      },
      { "kind": "extrude", "id": "e_f6", "name": "Extrude 2", "sketchId": "s_d4", "regions": [{ "vertical": "l_e1", "horizontal": "l_e2" }], "distance": "-(ply)", "op": "cut", "targetBodyId": "e_c3" }
    ]
  },
  "view": {
    "camera": { "azimuth": -45, "elevation": 35.264, "zoom": 6, "center": [0, 0, 0] },
    "sketchId": "s_d4"
  }
}
```

## Fields

- **plane** is `principal` with `plane` XZ, XY, or YZ, an `offset` along the normal axis, and a `normal` of 1 or -1; or `face` with the id of the extrude, the `region` of its sketch that was extruded, and which face of that extrusion: `cap` (the far end), `base`, or `side` with the `lineId` of the bounding line that swept the face and `outward` as 1 or -1 along that line's axis.
- **lines** each have a `dir` of `h` or `v`, an `at` position on the axis the line crosses, and a `run` with exactly two of `min`, `max`, `size` along the axis it runs on. A number is sixteenths; a string is an expression. A run end written as `l2.at` is a corner attached to that line. Optional `construction: true` keeps a line out of every region, and optional `layout` holds dimension placements per slot.
- **regions** on an extrude name each region by the ids of the vertical and horizontal lines that meet at its lower-left corner. A line coincident with either of them at that corner also satisfies the reference.
- **regionLabels** on a sketch stores width and height label placements keyed by the same two ids joined with `|`.
- **distance** is signed: positive along the plane normal. An expression against the normal is written `-(expr)`.
- **op** is `new`, `join`, or `cut`; `join` and `cut` carry `targetBodyId`, which is the id of the extrude that created the body.
- Ids are opaque and unique; handles are the short names expressions use.
- **view.camera** is the orbit azimuth and elevation in degrees, the orthographic zoom in pixels per inch, and the centre the camera looks at in sixteenths. **view.sketchId** names the sketch that was open, so the file reopens there.

Earlier versions open and are rewritten as version 4 on save. Version 1 stored rectangles as two corners, version 2 added parameters and per-axis slots, and version 3 added the view. Each rectangle becomes four attached lines, an extrude of a rectangle becomes an extrude of the region at that rectangle's lower-left corner, and expressions that named rectangle properties are rewritten to line positions. A rectangle that other rectangles subdivided keeps only its corner region; add the other parts to the extrude by hand.
