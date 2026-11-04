# LingoCoon Governance Overview

## Status

Top-level governance map linking all canonical governance documents. Derived from `docs/README.md`, `.agents/project/AGENTS.md`, `.agents/project/configuration-map.md`, and `docs/agents/agent-directory.md`. This is the entry point for governance — do not duplicate in other documents.

- Version: 1.0
- Last reviewed: 2026-10-25

---

## Governance Document Index

| Document | Purpose | Source of Truth |
| --- | --- | --- |
| **AGENTS-INDEX.md** | Canonical structured index of 18 agents, 28 skills, workflows, coordination rules, validation | `.agents/project/AGENTS.md`, `.agents/README.md`, `.agents/skills/`, `docs/agents/agent-directory.md` |
| **SKILLS-REGISTRY.md** | Detailed registry of all 28 skills with routing metadata, loading rules, agent mapping | `.agents/skills/`, `.agents/README.md`, `docs/agents/agent-directory.md` |
| **WORKFLOW-CATALOG.md** | Agent protocol, coordination rules, handoff contracts, standard workflow patterns | `.agents/project/AGENTS.md`, `docs/agents/agent-directory.md`, `docs/agents/chat-starters.md` |
| **SECURITY-GOVERNANCE.md** | Consolidated verified controls, threat model, phase-gated hardening backlog | `docs/security/security-baseline.md`, `docs/security/threat-model.md`, `docs/engineering/hardening-backlog.md` |
| **privacy.md** | Processing map, minimization, retention, rights, legal-review gates | Independent privacy baseline (reviewed by privacy_compliance_reviewer) |

---

## Governance Principles (from `.agents/project/AGENTS.md` §83–94)

1. **One source of truth per subject** — Link to an existing document instead of creating an alias copy
2. **Mark facts, risks, hypotheses, proposals, and external-state assumptions distinctly**
3. **Documentation changes only when behavior or an approved decision changed** — No speculative duplicate documents
4. **Private workspace policy** — `AGENTS.md`, `.agents/`, `.codex/`, and `docs/` are local to this checkout (gitignored)
5. **Publication boundary** — A future decision may publish a sanitized subset; until then, another clone will not receive these agents, skills, or documents

---

## Configuration Ownership (from `.agents/project/configuration-map.md`)

| Domain | Owner | Location | Publication |
| --- | --- | --- | --- |
| Product | product_strategist | `docs/product/` | Never |
| Architecture | software_architect | `docs/architecture/` | Never |
| Design | ux_ui_designer | `docs/design/` | Never |
| Engineering | fullstack_engineer | `docs/engineering/` | Never |
| Security | security_architect | `docs/security/` | Never |
| Governance | privacy_compliance_reviewer | `docs/governance/` | Never |
| Agents/skills | documentation_keeper | `docs/agents/`, `.agents/` | Never |
| CI/CD | devops_vercel_engineer | `.github/workflows/` | On merge to main |
| Git hooks | git_release_manager | `.claude/hooks/` | Never |
| Dependencies | fullstack_engineer | `package.json`, `package-lock.json` | On merge to main |

---

## Approval Boundaries (from `.agents/project/AGENTS.md` §40–48)

| Action | Requires |
| --- | --- |
| Local read-only inspection | None |
| Local verification (tests, lint, typecheck) | None |
| File mutation within approved task scope | User-approved task |
| Production data/config, Supabase remote, Vercel, DNS, GitHub settings, provider dashboards, credentials, paid services | Explicit approval for exact action |
| Read/copy/print/log/place secret values | Never |
| Commit, push, merge, rebase, rewrite history, deploy, publish | Explicit authorization |
| Git worktree/branch operations | Explicit authorization per workflow |

---

## Multi-Agent Coordination Summary

| Pattern | When | Agents Involved |
| --- | --- | --- |
| Single agent | Simple tasks, bug fixes, docs | One main agent |
| Delivery owner + reviewer | Approved feature with risky boundary | fullstack_engineer + security_architect/supabase_engineer/etc. |
| Orchestrator + parallel specialists | Architecture decisions, hardening, compliance | lingocoon_orchestrator + read-only specialists |
| Research & discovery | Unapproved problems, new ideas | idea_creator + product_strategist |

**Max concurrency**: 4 (1 orchestrator/main + up to 3 independent read-only specialists)

---

## Quality Gates (Mandatory Before Any Commit)

From `.agents/project/AGENTS.md` §75–81 and `docs/engineering/test-strategy.md`:

```bash
npm run check              # Full pipeline: secrets + test:security + lint + typecheck + build
npm audit --audit-level=high  # Dependency advisories
git diff --check           # Whitespace/format check
```

Plus change-specific checks:
- `secure-code-review` skill on diff
- `supabase-rls-audit` skill on diff (when database affected)
- `privacy-impact-assessment` skill on diff (when privacy-relevant)
- `post-change-quality-gate` skill (run and interpret)

**Test baseline**: 302 security tests must pass (0 failures)

---

## Phase-Gated Hardening (from `SECURITY-GOVERNANCE.md`)

| Phase | Focus | Timeline | Gate |
| --- | --- | --- | --- |
| P0 | Stop data exposure & unauthorized access | 0–2 weeks | Hostile audit complete + `npm run check` green |
| P1 | Privacy compliance & durable limits | 2–6 weeks | P0 done + export/deletion endpoints |
| P2 | Observability, testing, supply chain | 6–12 weeks | P1 done + CI integration |
| P3 | Architecture hardening | 12+ weeks | P2 done |
| P4 | Governance & documentation | Ongoing | Parallel |
| P5 | Maintenance | Ongoing | Parallel |

---

## Session Protocol (from Project CLAUDE.md)

**At session start**, restate:
- Goal
- Context files (paths)
- Constraints
- Done when (verifiable)
- Verify commands (actual npm scripts)

**At session end**, update `docs/work/HANDOFF.md`:
- Done
- Current state
- Next step
- Commands to resume

---

## Validation Checklist

- [ ] All 5 governance documents exist in `docs/governance/`
- [ ] All cross-references resolve to existing files
- [ ] AGENTS-INDEX.md linked from docs/README.md and .agents/project/AGENTS.md
- [ ] SECURITY-GOVERNANCE.md consolidates security-baseline.md, threat-model.md, hardening-backlog.md
- [ ] SKILLS-REGISTRY.md validates all 28 skill directories exist
- [ ] WORKFLOW-CATALOG.md matches agent protocol and coordination rules
- [ ] GOVERNANCE-OVERVIEW.md links all governance documents
- [ ] Configuration ownership map matches .agents/project/configuration-map.md
- [ ] Approval boundaries match .agents/project/AGENTS.md

---

## Cross-References

| Document | Location |
| --- | --- |
| Documentation index | `docs/README.md` |
| Authoritative project instructions | `.agents/project/AGENTS.md` |
| Configuration ownership map | `.agents/project/configuration-map.md` |
| Agent directory (human-readable) | `docs/agents/agent-directory.md` |
| Chat starters (handoff contracts) | `docs/agents/chat-starters.md` |
| Security baseline | `docs/security/security-baseline.md` |
| Threat model | `docs/security/threat-model.md` |
| Hardening backlog | `docs/engineering/hardening-backlog.md` |
| Privacy baseline | `docs/governance/privacy.md` |
| Test strategy | `docs/engineering/test-strategy.md` |
| Decision log | `docs/decisions/decision-log.md` |

---

## Italian Summary (for this governance creation)

```
Cosa: Creata governance completa Phase 1 (5 documenti canonici: AGENTS-INDEX, SKILLS-REGISTRY, WORKFLOW-CATALOG, SECURITY-GOVERNANCE, GOVERNANCE-OVERVIEW)
Rischio: Documenti duplicati o non sincronizzati se non mantenuti come single source of truth
Impatto: Chiarezza operativa per agenti, skill, workflow, sicurezza, privacy — base per compliance e audit
Verifica: Tutti i cross-reference risolvono, validazione checklist sopra, npm run check verde
Difesa: "Ogni documento ha source of truth definito, regole di caricamento esplicite, e boundary di approvazione non negoziabili"
```