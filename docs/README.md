# LingoCoon Documentation

## Status

Authoritative project documentation index.

- Version: 2.1
- Last reviewed: 2026-09-08

Use one source of truth per subject. Update a document only when verified behavior or an approved decision changes, then record material decisions in the [decision log](decisions/decision-log.md). Archived or unindexed material is non-authoritative.

## Product

- [Context Studio](product/context-studio.md): active reader scope, owner, handoff, acceptance gaps, and verification status. Start here for reader work.
- [Vision and principles](product/vision-and-principles.md): product promise and learning principles.
- [Learning profile v1](product/learning-profile-v1.md): personalization inputs, evidence, controls, and boundaries.
- [First learning mission](product/first-learning-mission.md): approved first end-to-end experience.
- [Roadmap](product/roadmap.md): verified current state, priorities, gates, and rebuild sequence.

## Architecture

- [System overview](architecture/system-overview.md): current stack, runtime surfaces, boundaries, and target delta.
- [Learning engine](architecture/learning-engine.md): adaptive-learning flow and target service boundaries.
- [Data model](architecture/data-model.md): target sessions, events, signals, recommendations, ownership, and retention.
- [AI contracts](architecture/ai-contracts.md): bounded evaluation, usage, quality, privacy, and fallback contracts.

## Design

- [UX principles](design/ux-principles.md): personalized home, first-mission flow, states, accessibility, and acceptance criteria.
- [Visual system](design/visual-system.md): canonical visual direction, original raccoon brief, and migration order.

## Engineering

- [Local development](engineering/local-development.md): setup and repository commands.
- [Environments](engineering/environments.md): local/preview/production boundaries and configuration names.
- [Test strategy](engineering/test-strategy.md): current evidence, target layers, change matrix, and quality gate.

## Security and governance

- [Security baseline](security/security-baseline.md): verified controls, open requirements, and finding standard.
- [Threat model](security/threat-model.md): assets, trust boundaries, attack hypotheses, mitigations, and unknowns.
- [Privacy baseline](governance/privacy.md): processing map, minimization, retention, rights, and legal-review gates.
- [Decision log](decisions/decision-log.md): approved material choices and consequences.
- [Agents & Skills Index](governance/AGENTS-INDEX.md): canonical structured index of all agents, skills, workflows, coordination rules, and validation criteria.
- [Skills Registry](governance/SKILLS-REGISTRY.md): detailed registry of all skills with routing metadata, loading rules, and agent mapping.
- [Workflow Catalog](governance/WORKFLOW-CATALOG.md): agent protocol, coordination rules, handoff contracts, and standard workflow patterns.
- [Security Governance](governance/SECURITY-GOVERNANCE.md): consolidated security baseline, threat model, and phase-gated hardening backlog.
- [Governance Overview](governance/GOVERNANCE-OVERVIEW.md): top-level governance map linking all canonical documents, configuration ownership, and approval boundaries.

## Agents and working method

- [Agent directory](agents/agent-directory.md): Codex runtime contract, 18 roles, 28 skills, routing, and permissions.
- [Agents & Skills Index](governance/AGENTS-INDEX.md): canonical structured index of all agents, skills, workflows, coordination rules, and validation criteria.
- [Working method and task starters](agents/chat-starters.md): one delivery owner, explicit handoffs, and optional bounded research/review.
- [Project instructions](../.agents/project/AGENTS.md): complete local operating and approval rules.
- [Agent workspace](../.agents/README.md): skill routing and loading order.
- [Configuration map](../.agents/project/configuration-map.md): ownership, location, publication, and validation.

## Requested-name mapping

The operating-system brief used flat document names. LingoCoon keeps its existing structured folders instead of creating duplicate aliases.

| Requested concept | Authoritative source |
| --- | --- |
| `PROJECT_BRIEF` | `product/vision-and-principles.md` and `product/learning-profile-v1.md` |
| `ARCHITECTURE` | `architecture/system-overview.md` and `architecture/learning-engine.md` |
| `DATA_MODEL` | `architecture/data-model.md` |
| `ENVIRONMENTS` | `engineering/environments.md` |
| `SECURITY_BASELINE` | `security/security-baseline.md` |
| `THREAT_MODEL` | `security/threat-model.md` |
| `TEST_STRATEGY` | `engineering/test-strategy.md` |
| `DESIGN_SYSTEM` | `design/visual-system.md` |
| `LEARNING_MODEL` | `product/learning-profile-v1.md` and `architecture/learning-engine.md` |
| `AI_SAFETY` | `architecture/ai-contracts.md` and `security/security-baseline.md` |
| `PRIVACY` | `governance/privacy.md` |
| `ROADMAP` | `product/roadmap.md` |
| `DECISIONS` | `decisions/decision-log.md` |
| `AGENT_DIRECTORY` | `agents/agent-directory.md` |
| `CHAT_STARTERS` | `agents/chat-starters.md` |

The documents and Codex workspace are currently ignored and local to this checkout. See [publication and portability](agents/agent-directory.md#publication-and-portability) before assuming they exist in another clone.
