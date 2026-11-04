# LingoCoon Skills Registry

## Status

Canonical registry of all 28 skills with routing metadata, loading rules, and cross-references. Derived from `.agents/skills/`, `.agents/README.md`, and `docs/agents/agent-directory.md`. This is the single source of truth for skill governance — do not duplicate in other documents.

- Version: 1.0
- Last reviewed: 2026-10-25

---

## Skill Loading Rules (from `.agents/project/AGENTS.md` §4–9, `.agents/README.md` §5–12)

1. Root `AGENTS.md` discovered automatically by Codex
2. Read `.agents/project/AGENTS.md` completely before project work
3. Read `.agents/project/configuration-map.md` for config/tooling/Git/CI/deployment/publication
3. Read relevant authoritative document in `../docs/`
4. **Load every skill explicitly named by user or assigned agent prompt**
5. Add only the narrow additional skills required by the active task
6. Skill discovery exposes routing metadata; selecting a skill requires reading its full `SKILL.md`
7. Codex can select matching skills implicitly; user does not need to name them in every request
7. Delegation prompts must name required skills explicitly; recipient must confirm loading them
8. A skill list or task name alone proves neither invocation nor correct execution
9. Every skill preserves the approval boundaries in `.agents/project/AGENTS.md`

---

## Domain Skills (6)

| Skill | Directory | Use For | Routing Context |
| --- | --- | --- | --- |
| `lingocoon-product` | `.agents/skills/lingocoon-product/` | Product strategy, personalization, priorities, gamification, learner outcomes | Product decisions, roadmap, scope |
| `lingocoon-research` | `.agents/skills/lingocoon-research/` | Verified product, competitor, learning, UX, technology, repository research | Unapproved problems, evidence gathering |
| `lingocoon-ux` | `.agents/skills/lingocoon-ux/` | Learner flows, information architecture, interaction states, interface behavior | UX design, flow reviews |
| `lingocoon-minimal` | `.agents/skills/lingocoon-minimal/` | Visual-system rules, component styling, monochrome migration | Visual system, design reviews |
| `lingocoon-ai-learning` | `.agents/skills/lingocoon-ai-learning/` | Bounded AI learning workflows, evaluation, privacy, limits, fallback | AI learning features, safety reviews |
| `lingocoon-engineering` | `.agents/skills/lingocoon-engineering/` | Explicitly approved code, refactor, test, integration, dependency, migration | Implementation, refactoring, migrations |

---

## Procedure Skills (22)

| Skill | Directory | Repeatable Procedure | Routing Context |
| --- | --- | --- | --- |
| `feature-discovery` | `.agents/skills/feature-discovery/` | Convert unapproved problem into decision-ready brief | Problem exploration, pre-approval |
| `feature-delivery` | `.agents/skills/feature-delivery/` | Deliver one approved feature from contract through verification | Approved feature implementation |
| `learning-feature-design` | `.agents/skills/learning-feature-design/` | Specify measurable learning activity or mission | Learning content design |
| `adaptive-path-evaluation` | `.agents/skills/adaptive-path-evaluation/` | Review adaptive recommendation policy for evidence, fairness, control | Adaptive algorithm review |
| `design-system-review` | `.agents/skills/design-system-review/` | Review UI diff/spec against approved visual system | UI component reviews |
| `accessibility-audit` | `.agents/skills/accessibility-audit/` | Audit semantics, keyboard, screen reader, motion, audio, responsive barriers | WCAG compliance checks |
| `secure-code-review` | `.agents/skills/secure-code-review/` | Review bounded code path/diff for exploitable security regressions | Security review of changes |
| `threat-model-update` | `.agents/skills/threat-model-update/` | Update assets, boundaries, attack paths, mitigations, residual risk | Architecture/security changes |
| `supabase-rls-audit` | `.agents/skills/supabase-rls-audit/` | Audit versioned grants, functions, ownership, RLS | Database security audits |
| `safe-database-migration` | `.agents/skills/safe-database-migration/` | Prepare one forward migration with rollback and RLS evidence | Schema migrations |
| `server-action-security` | `.agents/skills/server-action-security/` | Review Server Action/Route Handler trust boundary | Next.js server boundary review |
| `authorized-red-team-test` | `.agents/skills/authorized-red-team-test/` | Run one explicitly authorized defensive abuse test | Authorized penetration testing |
| `dependency-and-secret-scan` | `.agents/skills/dependency-and-secret-scan/` | Check dependencies and reachable Git content without printing secrets | Supply chain security |
| `test-plan-and-coverage` | `.agents/skills/test-plan-and-coverage/` | Build risk-based test and coverage map | Test planning, coverage gaps |
| `browser-e2e-validation` | `.agents/skills/browser-e2e-validation/` | Validate approved local/preview flow with reproducible evidence | E2E test execution |
| `git-safe-workflow` | `.agents/skills/git-safe-workflow/` | Plan or perform explicitly authorized Git workflow | Git operations |
| `vercel-preview-release` | `.agents/skills/vercel-preview-release/` | Prepare and verify preview/release handoff without implicit deployment | Vercel deployment prep |
| `performance-budget-review` | `.agents/skills/performance-budget-review/` | Review explicit web/server/database/provider budgets | Performance regression review |
| `ai-abuse-and-cost-review` | `.agents/skills/ai-abuse-and-cost-review/` | Review AI/TTS/STT abuse, privacy, retries, cost, fallback | AI operation safety review |
| `privacy-impact-assessment` | `.agents/skills/privacy-impact-assessment/` | Assess collection, retention, provider transfer, user rights | Privacy compliance |
| `documentation-sync` | `.agents/skills/documentation-sync/` | Update authoritative docs after verified behavior or decisions change | Documentation maintenance |
| `post-change-quality-gate` | `.agents/skills/post-change-quality-gate/` | Run and interpret proportionate final verification | Pre-commit/pre-merge gate |

---

## Skill-to-Agent Default Mapping (from `docs/agents/agent-directory.md` §53–85)

| Agent | Default Skills |
| --- | --- |
| `lingocoon_orchestrator` | `feature-discovery`, `test-plan-and-coverage`, `documentation-sync` |
| `product_strategist` | `lingocoon-product`, `feature-discovery` |
| `learning_scientist` | `learning-feature-design`, `adaptive-path-evaluation`, `lingocoon-ai-learning` |
| `idea_creator` | `feature-discovery`, `lingocoon-research` |
| `ux_ui_designer` | `lingocoon-ux`, `design-system-review`, `accessibility-audit` |
| `software_architect` | `threat-model-update`, `performance-budget-review`, `test-plan-and-coverage` |
| `fullstack_engineer` | `feature-delivery`, `lingocoon-engineering`, `post-change-quality-gate` |
| `frontend_engineer` | `lingocoon-engineering`, `design-system-review`, `accessibility-audit`, `browser-e2e-validation` |
| `supabase_engineer` | `supabase-rls-audit`, `safe-database-migration`, `post-change-quality-gate` |
| `security_architect` | `secure-code-review`, `threat-model-update`, `server-action-security` |
| `red_team_tester` | `authorized-red-team-test`, `dependency-and-secret-scan` |
| `qa_test_engineer` | `test-plan-and-coverage`, `browser-e2e-validation`, `post-change-quality-gate` |
| `devops_vercel_engineer` | `vercel-preview-release`, `performance-budget-review`, `post-change-quality-gate` |
| `git_release_manager` | `git-safe-workflow`, `dependency-and-secret-scan` |
| `ai_safety_engineer` | `lingocoon-ai-learning`, `ai-abuse-and-cost-review`, `privacy-impact-assessment` |
| `privacy_compliance_reviewer` | `privacy-impact-assessment`, `documentation-sync` |
| `performance_accessibility_engineer` | `performance-budget-review`, `accessibility-audit` |
| `documentation_keeper` | `documentation-sync`, `post-change-quality-gate` |

---

## Skill Validation Criteria

- [ ] All 28 skill directories exist under `.agents/skills/`
- [ ] Each skill has a valid `SKILL.md` with: description, procedure, boundaries, examples
- [ ] All cross-references in this document resolve to existing files
- [ ] Skill routing table in `.agents/README.md` §29–38 matches this registry
- [ ] No orphan skills (skills without agent mapping or routing context)

---

## Cross-References

| Source | Location |
| --- | --- |
| Agent inventory & runtime contract | `docs/governance/AGENTS-INDEX.md` |
| Human-readable agent matrix | `docs/agents/agent-directory.md` |
| Skill routing table | `.agents/README.md` §29–38 |
| Authoritative project instructions | `.agents/project/AGENTS.md` |
| Configuration ownership map | `.agents/project/configuration-map.md` |

---

## Validation

- Confirm all listed skill directories exist under `.agents/skills/`
- Confirm skill routing table in `.agents/README.md` matches this registry
- Confirm all cross-references resolve to existing files
- Run skill validator when available; otherwise validate YAML and paths and disclose limitation