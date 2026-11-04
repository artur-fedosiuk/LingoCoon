---
name: documentation-sync
description: Synchronize LingoCoon authoritative documentation after verified behavior or an approved decision changes; do not use to create speculative duplicate documents.
---

# Documentation Sync

## Procedure

1. Identify the verified code/config/data behavior or approved decision that changed.
2. Use `docs/README.md` to find the single authoritative document; link instead of copying.
3. Update status, version, review date, contracts, commands, risks, and open decisions proportionately.
4. Record a material approved decision and consequences in `docs/decisions/decision-log.md`; do not log brainstorming as a decision.
5. Synchronize `.agents/README.md`, agent directory, skill inventory, and configuration map only when those artifacts changed.
6. Check relative links, paths, stale statements, and claims of tests/deployments against evidence.

Return files, evidence source, stale content removed, links checked, and unresolved decisions. Documentation edits do not authorize code, external, or product changes.
