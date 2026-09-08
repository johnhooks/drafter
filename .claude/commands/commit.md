---
name: commit
description: Create a very concise conventional commit focused on the functional change
allowed-tools: Bash(git *)
---

# Commit

Running this command is an explicit request to commit. Use $ARGUMENTS and the
visible conversation as optional guidance. When guidance is absent, inspect the
repo to find what changed and what the message should say.

## Message

- Conventional commit: `type(scope): summary`. Title 50 characters or less,
  imperative, lowercase, no period.
- Smallest accurate type: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`,
  `build`, or `spec` for OpenSpec artifacts. Scope only when it adds context.
- Describe the user-visible, maintainer-visible, or workflow-visible behavior
  that changed. Say what was added or changed, not what was removed to make
  room for it, and not implementation trivia.
- Body only when the why is not obvious from the diff. Wrap at 80 characters.
  No bullet list for a single-purpose change.
- Do not state that the change was tested.
- No emoji.

## Staging

- Stage with explicit file paths. Never `git add -A` or `git add .`.
- Do not stage unrelated files. If the tree holds unrelated changes, ask
  whether the developer wants one combined commit or separate commits.
- Ask a targeted question only when the commit boundary or intent is
  ambiguous; otherwise proceed.

## Process

1. `git status` and `git diff` (staged and unstaged) to see what changed.
2. Stage the related files by path.
3. Commit. Show `git log --oneline -1`.
4. Never push.
