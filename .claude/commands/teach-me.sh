#!/usr/bin/env bash
# /teach-me — 3 questions on last change, logs to docs/learning-log.md
set -euo pipefail

LOG_FILE="docs/private/learning-log.md"
mkdir -p docs/private

# Get last commit message
LAST_COMMIT=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "No commits yet")

echo "=== Teach Me: $LAST_COMMIT ==="
echo ""

# Question 1
read -p "Q1: What was the main change? " ANSWER1

# Question 2
read -p "Q2: What could break? " ANSWER2

# Question 3
read -p "Q3: How do you verify it works? " ANSWER3

# Append to log
{
  echo "## $(date '+%Y-%m-%d %H:%M') — $LAST_COMMIT"
  echo ""
  echo "**Q1:** $ANSWER1"
  echo ""
  echo "**Q2:** $ANSWER2"
  echo ""
  echo "**Q3:** $ANSWER3"
  echo ""
  echo "---"
  echo ""
} >> "$LOG_FILE"

echo ""
echo "Logged to $LOG_FILE"