---
name: git-safe-workflow
description: Plan or perform an explicitly authorized safe Git branch, worktree, commit, merge, or history workflow; do not use for routine read-only diff inspection alone.
---

# Git Safe Workflow

## Procedure

1. Inspect `git status --short --branch`, `git branch -vv`, relevant `git log --all --graph --decorate --oneline`, and remotes.
2. Resolve exact branch names, SHAs, ancestry, staged files, and whether a prior pull request used squash merge.
3. Preserve unrelated changes and create a recoverable reference before an authorized history rewrite.
4. Preview commands, affected refs, remote effects, conflicts, rollback, and verification before executing a write.
5. Run `git diff --check`, inspect `git diff` and `git diff --cached`, and run the current-tree secret scan before commit or push.
6. Verify the resulting graph and remote only after the corresponding action is authorized.

Return current state, exact commands, effects, risks, recovery, and approval checkpoint. Never guess refs, use broad destructive targets, push, force-update, merge, rebase, tag, delete, or publish without explicit permission.
