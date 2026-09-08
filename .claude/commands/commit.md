---
description: Commit staged and unstaged changes with a very concise conventional commit message
allowed-tools: Bash(git *)
---

Commit the current changes.

Rules:
- Very concise conventional commit: `type(scope): summary`, summary under 50 characters, imperative, lowercase, no period.
- Types: feat, fix, refactor, test, docs, chore, build, spec (OpenSpec artifacts).
- Scope is optional. Use it only when it adds information (a module or change name).
- No body unless the why is not obvious from the diff. If a body is needed, one or two short lines.
- No co-author trailer, no session link, no emoji.
- Never push.

Steps:
1. Run `git status` and `git diff` to see what changed.
2. Stage everything relevant with `git add -A` unless the user said otherwise.
3. Commit with the message. Show the resulting `git log --oneline -1`.

Arguments, if given, are a hint for the message: $ARGUMENTS
