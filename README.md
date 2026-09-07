# Game AI Workflows

A portable, AI-agent-agnostic Game Design → Feature → Development → QA workflow framework.

## Architecture

```
                         GDD SOURCE (Google Drive / Local / Custom)
                              │
                              ▼
                       GDD PROVIDER INTERFACE
                              │
                              ▼
                         GDD SYNC
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
           GDD SNAPSHOTS             GDD REGISTRY
                                           │
                                           ▼
                                    FEATURE REGISTRY
                                           │
              ┌────────────────────────────┼────────────────────┐
              ▼                            ▼                    ▼
       FEATURE DISCOVERY             DESIGN REVIEW       IMPACT ANALYSIS
                                           │
                                           ▼
                                      FEATURE SPEC
                                           │
                                           ▼
                                  IMPLEMENTATION PLAN
                                           │
                                      PREFLIGHT CHECK
                                           │
                                    IMPLEMENTATION
                                           │
                                      TEST → PLAYTEST → VERIFY
```

Agent layer:

```
                  PORTABLE WORKFLOW CORE
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Claude          Codex         Generic
       Adapter         Adapter       Adapter
```

## Core Principle

The workflow logic lives in **portable skills** and **core scripts**.
Agent-specific code lives only in **adapters**.
GDD access goes through a **provider interface**, not directly to Google Drive.

## Quick Start

### 1. Bootstrap

```bash
node scripts/bootstrap/bootstrap.mjs
```

Or via an agent adapter:
- Claude Code: `/ai-workflow-setup`
- Codex: `node adapters/codex/codex-cli.mjs bootstrap`
- Generic: `node adapters/generic/agent-workflow.mjs bootstrap`

### 2. Validate

```bash
node scripts/validate/validate.mjs
```

### 3. List Features

```bash
node adapters/generic/agent-workflow.mjs list-features
node adapters/generic/agent-workflow.mjs list-features IN_PROGRESS
```

### 4. Find Feature

```bash
node adapters/generic/agent-workflow.mjs find-feature inventory
node adapters/generic/agent-workflow.mjs find-feature inventroy  # typo handling
```

### 5. Feature Status

```bash
node adapters/generic/agent-workflow.mjs feature-status gameplay.inventory
```

## Directory Structure

```
game-ai-workflows/
│
├── skills/                  # Portable skill definitions (SKILL.md)
│   ├── bootstrap/
│   ├── design-sync/
│   ├── list-features/
│   ├── find-feature/
│   ├── new-feature/
│   ├── review-design/
│   ├── review-design-changes/
│   ├── feature-status/
│   ├── feature-impact/
│   ├── plan-feature/
│   ├── implement-feature/
│   ├── test-feature/
│   ├── playtest/
│   └── close-feature/
│
├── contracts/               # Document templates
│   ├── FEATURE_SPEC.md
│   ├── DESIGN_CHANGE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── QA_REPORT.md
│   └── FEATURE_STATUS.md
│
├── schemas/                 # JSON Schema definitions
│   ├── feature.schema.json
│   ├── gdd.schema.json
│   ├── design-change.schema.json
│   ├── implementation-plan.schema.json
│   └── qa-report.schema.json
│
├── providers/               # GDD provider abstraction
│   ├── provider-interface.mjs
│   ├── provider-factory.mjs
│   ├── google-drive/
│   ├── local/
│   └── generic/
│
├── agents/                  # Agent role definitions
│   ├── design-reviewer.md
│   ├── architect.md
│   ├── programmer.md
│   └── qa.md
│
├── adapters/                # Agent-specific adapters
│   ├── claude-code/
│   ├── codex/
│   └── generic/
│
├── scripts/                 # Core executable scripts
│   ├── bootstrap/
│   ├── validate/
│   └── registry/
│
├── docs/                    # Documentation
│   ├── architecture/
│   ├── workflows/
│   ├── setup/
│   └── examples/
│
└── tests/                   # Test suite
    ├── registry/
    ├── validation/
    ├── bootstrap/
    └── workflows/
```

## Project-Side Structure

When integrated into a game project:

```
your-game/
├── docs/
│   ├── gdd/
│   │   └── snapshots/        # Historical GDD versions
│   ├── features/             # Per-feature specs and plans
│   ├── registry/
│   │   ├── gdd.yaml          # GDD document registry
│   │   ├── features.yaml     # Feature registry (authoritative)
│   │   └── systems.yaml      # System registry
│   └── design-changes/       # Design change records
│
└── .ai/
    ├── config/
    │   └── gdd.yaml           # Provider configuration (non-secret)
    ├── gdd-state.json         # GDD sync state
    ├── setup-state.json       # Bootstrap state
    └── cache/                 # Local cache (gitignored)
```

## Feature Lifecycle

```
PLANNED → DESIGN_REVIEW → READY → IN_PROGRESS → IMPLEMENTED → TESTING → PLAYTEST → VERIFIED
```

Special states: `BLOCKED`, `NEEDS_REVIEW`, `DESIGN_CHANGED`, `DEPRECATED`, `CANCELLED`

See [docs/workflows/feature-lifecycle.md](docs/workflows/feature-lifecycle.md) for transition rules.

## Stable Feature IDs

Features use stable IDs in `category.name` format:

```
gameplay.defender-mode
gameplay.inventory
system.wave-spawner
ui.hud
```

Display names may change. IDs must not (unless the concept changes).

## GDD Provider

The workflow accesses GDD through a provider interface:

| Provider | Status | Description |
|----------|--------|-------------|
| `google-drive` | Implemented | Google Drive via MCP |
| `local` | Implemented | Local markdown files |
| `generic` | Stub | Extend for Notion, Confluence, etc. |

See [docs/setup/google-drive.md](docs/setup/google-drive.md) for Google Drive setup.

## Commands / Skills

| Skill | Purpose |
|-------|---------|
| `bootstrap` | Initialize workflow environment |
| `design-sync` | Sync GDD, create snapshots, detect changes |
| `list-features` | List features with optional status filter |
| `find-feature` | Find feature by ID/name/fuzzy match |
| `new-feature` | Create new feature with scaffolding |
| `review-design` | Review design for completeness |
| `review-design-changes` | Review pending design changes |
| `feature-status` | Show comprehensive feature status |
| `feature-impact` | Trace all feature relationships |
| `plan-feature` | Generate implementation plan |
| `implement-feature` | Implement feature following plan |
| `test-feature` | Run and analyze feature tests |
| `playtest` | Create playtest checklist |
| `close-feature` | Verify and close feature |

## Adapters

### Claude Code
Slash commands: `/ai-workflow-setup`, `/design-sync`, `/list-features`, etc.
See [adapters/claude-code/README.md](adapters/claude-code/README.md).

### Codex
CLI: `node adapters/codex/codex-cli.mjs <command>`
See [adapters/codex/README.md](adapters/codex/README.md).

### Generic
CLI: `node adapters/generic/agent-workflow.mjs <command>`
See [adapters/generic/README.md](adapters/generic/README.md).

## Testing

```bash
node --test tests/registry/feature-registry.test.mjs
node --test tests/validation/validator.test.mjs
node --test tests/bootstrap/bootstrap.test.mjs
node --test tests/workflows/lifecycle.test.mjs

# Run all tests
node --test tests/**/*.test.mjs
```

## Rules

See [docs/architecture/AI_WORKFLOW_RULES.md](docs/architecture/AI_WORKFLOW_RULES.md).

Key rules:
- Feature Registry is authoritative
- Stable IDs are mandatory
- Never guess feature IDs
- GDD is design source of truth
- Stale design blocks implementation
- Verification requires evidence
- Bootstrap before workflows when dependencies missing
- Never commit credentials

## Offline Mode

Everything not requiring GDD provider works offline:
`list-features`, `find-feature`, `feature-status`, `feature-impact`, `plan-feature`, `test-feature`, `validate`

If GDD is needed and provider unavailable, the system reports stale state and asks before proceeding.

## Security

- No secrets in config files committed to Git
- OAuth handled by provider (browser flow)
- `.ai/cache/` and state files gitignored
- No credentials printed in logs
- Safe templates for configuration
