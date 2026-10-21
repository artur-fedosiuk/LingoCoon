#!/usr/bin/env bash
# /verify — Run full verification pipeline + npm audit
set -euo pipefail

echo "=== Running npm run check ==="
npm run check

echo ""
echo "=== Running npm audit ==="
npm audit --audit-level=high

echo ""
echo "=== Verify complete ==="