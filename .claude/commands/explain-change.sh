#!/usr/bin/env bash
# /explain-change — Run explainer subagent on current diff
set -euo pipefail

# Get the diff
DIFF=$(git diff HEAD)

if [ -z "$DIFF" ]; then
  echo "No changes to explain"
  exit 0
fi

echo "=== Diff to explain ==="
echo "$DIFF"
echo ""
echo "=== Running explainer (would invoke subagent) ==="
echo "Note: In Claude Code, this would invoke the explainer subagent."
echo "For now, showing the diff above for manual review."