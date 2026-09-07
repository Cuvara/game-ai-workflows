# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Portable, AI-agent-agnostic Game Design → Feature → Development → QA workflow framework. Decouples workflow core from any specific agent (Claude Code, Codex, generic CLI).

## Commands

```bash
# Run all tests (Node 18+ required, uses built-in node:test runner)
npm test

# Scoped test suites
npm run test:registry       # Feature/system registry parsing & lookup
npm run test:validation     # Validator logic (duplicates, states, refs)
npm run test:bootstrap      # Bootstrap env detection & idempotency
npm run test:workflows      # Feature lifecycle state machine

# Run single test file
node --test tests/registry/feature-registry.test.mjs

# Bootstrap (initialize project environment)
node scripts/bootstrap/bootstrap.mjs

# Validate workflow registries
node scripts/validate/validate.mjs

# Generic CLI (works without any agent)
node adapters/generic/agent-workflow.mjs list-features
node adapters/generic/agent-workflow.mjs find-feature <query>
node adapters/generic/agent-workflow.mjs feature-status <id>
```

## Architecture

```
Providers → Core Scripts → Adapters
    ↓            ↓
 GDD Source   Registries (YAML in docs/registry/)
              State (.ai/)
```

**Core chain**: `bootstrap.mjs` → `validate.mjs` → `feature-lookup.mjs`. All adapters load these three + `provider-factory.mjs`.

**Module format**: All ESM (`.mjs`, `type: "module"` in package.json). No CommonJS.

**Dependencies**: Zero external. Custom YAML parser in `validate.mjs` (intentional — handles registry array-of-objects format only). JSON schemas for documentation/offline validation, not enforced at runtime.

## Key Import Graph

```
feature-lookup.mjs  ──imports──▶  validate.mjs (parseSimpleYaml)
adapters/*          ──imports──▶  bootstrap.mjs, validate.mjs, feature-lookup.mjs, provider-factory.mjs
provider-factory.mjs ──imports──▶  google-drive-provider.mjs, local-provider.mjs, generic-provider.mjs
```

## Conventions

- **Feature IDs**: `category.name` format (e.g., `gameplay.inventory`). Regex: `^[a-z]+\.[a-z][a-z0-9_-]*$`. Categories: gameplay, system, ui, infrastructure, meta.
- **Feature statuses**: 13 states with enforced transitions. Happy path: PLANNED → DESIGN_REVIEW → READY → IN_PROGRESS → IMPLEMENTED → TESTING → PLAYTEST → VERIFIED. Terminal: CANCELLED, DEPRECATED.
- **Registries**: `docs/registry/{features,systems,gdd}.yaml` — authoritative source. Feature Registry is the single source of truth for features.
- **State**: `.ai/` directory holds local state (gdd-state.json, setup-state.json, cache/). Gitignored except `config/gdd.yaml`.
- **Skills**: `skills/*/SKILL.md` define portable procedures. No Claude-specific assumptions — use abstract capabilities (read files, write files, ask user, etc.).
- **Adapters**: Agent-specific code lives ONLY in `adapters/`. Never put Claude/Codex logic in core scripts or skills.
- **Bootstrap**: Constructor takes `projectRoot` parameter. Always pass explicitly in tests — never rely on `process.cwd()` for testability.

## Workflow Rules

- Never guess feature IDs — resolve through registry, show candidates for ambiguous matches
- GDD (via provider) is design source of truth; Feature Spec is engineering source of truth
- Stale GDD must block implementation (design-sync required first)
- Never mark feature VERIFIED without evidence (tests passing, playtest complete)
- Bootstrap is idempotent — safe to run repeatedly
- Never commit secrets; `.gitignore` covers `.ai/cache/`, state files, credentials
