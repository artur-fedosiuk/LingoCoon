# Private Documentation (gitignored)

This folder is for **your personal notes, learnings, and decisions** — never committed.

## Structure

```
docs/private/
├── learning-log.md      # Created by /teach-me command (3 Qs per change)
├── decisions/           # Your personal decision records
├── interview-prep/      # Notes for interview defense
└── scratch/             # Temporary notes, experiments
```

## Usage

- **`/teach-me`** → appends to `docs/private/learning-log.md` (not `docs/learning-log.md`)
- Manual notes → any `.md` file here
- **Never commit** — entire `docs/` is in `.gitignore`

## Decision Log (tracked separately)

For **approved project decisions** that should be tracked, use:
`docs/decisions/decision-log.md` (this one IS tracked in git)