## Context

The store is a zustand store over `State` with pure actions `(state, payload) => state` and `withDoc` as the single place a new document enters state and is evaluated. Documents are immutable and share structure, so keeping many of them is cheap.

## Goals / Non-Goals

**Goals:**
- Undo any document change with one mechanism, no per-action inverse logic.
- Predictable grouping.

**Non-Goals:**
- Undo for view state, a history panel, persistence of history.

## Decisions

**Snapshots, not inverses.** State gains `history: { past: Document[]; future: Document[] }`. `withDoc` pushes the old document onto `past`, clears `future`, and trims `past` to 200. Because every action that changes the document goes through `withDoc`, nothing else needs to know about history. Alternatives: inverse actions (more code, and the cascade delete and parameter rename would each need a bespoke inverse); immer patches (a dependency for what structural sharing already gives).

**Coalescing by key and time.** Actions that come from typing (`setTitle`, `renameFeature`, `renameParam` name edits) carry a coalesce key such as `title` or `name:<id>`. `withDoc` takes an optional key; if it matches the key of the last push and less than two seconds have passed, the previous document is not pushed again. The time comes from a `now` parameter with a default, so tests control it.

**Undo and redo are actions like any other.** `undo(state)` pops `past`, pushes the current document onto `future`, evaluates, then reconciles view state: mode returns to model if the edited sketch is gone, selection ids that no longer resolve are dropped, `lastGood` is kept. `redo` mirrors it. Neither goes through `withDoc`'s push.

**Keys.** A window keydown listener in `App` handles Z with the platform modifier, skipping when the event target is an input, textarea, or contenteditable. macOS uses Meta, others Control.

**Boundaries.** `loadDocument` and the initial restore build a fresh state with empty stacks.

## Risks / Trade-offs

- [Memory from 200 snapshots of a large document] → Snapshots share every unchanged feature; a document with hundreds of features is still well under a megabyte of unique data.
- [A future action that bypasses `withDoc`] → A store test asserts that every exported action that changes `doc` also grows `past`, by running each against a fixture.
