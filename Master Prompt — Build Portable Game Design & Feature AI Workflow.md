# MASTER IMPLEMENTATION PROMPT
# Portable Game Design → Feature → Development → QA Workflow

You are the lead software architect and implementation agent.

Your task is to implement a complete, production-ready, **AI-agent-agnostic Game Design → Feature → Development → QA workflow framework** for this project.

The system MUST work across:

- Claude Code CLI
- Claude desktop/app agents
- Codex CLI
- Codex-style coding agents
- generic coding agents
- future AI coding agents

Claude Code is only the current implementation agent used to build the framework.

DO NOT design the core workflow around Claude Code.

---

# 1. PRIMARY GOAL

Build a system connecting:

```text
Google Drive GDD
        ↓
GDD Provider
        ↓
GDD Sync
        ↓
GDD Registry
        ↓
Feature Registry
        ↓
Feature Specification
        ↓
Design Review
        ↓
Implementation Plan
        ↓
Implementation
        ↓
Testing
        ↓
Playtest
        ↓
Verification
        ↓
Changelog
```

The system must provide:

- stable feature IDs
- GDD synchronization
- GDD version tracking
- GDD snapshots
- design diff
- design-change tracking
- impact analysis
- feature discovery
- feature lifecycle
- feature specification
- implementation planning
- implementation control
- test tracking
- playtest tracking
- traceability
- safe failure
- portable AI-agent skills
- automatic first-time environment setup
- dependency detection
- Google Drive setup/bootstrap

---

# 2. CORE PRINCIPLE

Separate the architecture into:

```text
PORTABLE CORE
+
AGENT ADAPTERS
+
PROVIDERS
+
PROJECT DATA
```

Architecture:

```text
                    PORTABLE WORKFLOW CORE
                             │
             ┌───────────────┼────────────────┐
             │               │                │
          Skills         Contracts         Schemas
             │               │                │
             └───────────────┼────────────────┘
                             │
                    Provider Abstraction
                             │
                  ┌──────────┼──────────┐
                  │          │          │
             Google Drive   Local      Future
                  │         Files      Provider
                  │
                  ▼
              GDD Registry
                  │
                  ▼
            Feature Registry
                  │
       ┌──────────┼───────────┐
       ▼          ▼           ▼
    Claude      Codex       Generic
    Adapter     Adapter     Adapter
```

The portable core must contain the actual workflow logic.

Adapters only provide execution/integration mechanisms.

---

# 3. FIRST-RUN BOOTSTRAP IS MANDATORY

The workflow MUST support automatic first-time setup.

A user should be able to install the skills/workflow and run:

```text
/design-sync
```

or:

```text
/feature-status
```

without manually understanding the internal dependency architecture.

The system must first perform a bootstrap/preflight check.

Conceptually:

```text
User runs skill
       ↓
Bootstrap Check
       ↓
Are dependencies installed?
       │
   ┌───┴────┐
   YES      NO
    │        │
    │     Can auto-install?
    │        │
    │    ┌───┴────┐
    │   YES       NO
    │    │         │
    │ Install     Ask user
    │    │         │
    └────┴─────────┘
             ↓
        Configuration
             ↓
      Authentication
             ↓
       Validation
             ↓
        Run Skill
```

---

# 4. BOOTSTRAP PRINCIPLE

The agent must distinguish:

### A. Detectable information

The agent should detect automatically.

Examples:

- operating system
- project root
- Git repository
- Node version
- Python version
- .NET version
- installed CLI tools
- existing MCP configuration
- existing Google Drive configuration
- existing credentials/configuration where safely detectable
- existing skill installation
- existing registry
- existing `.ai` state
- existing environment variables

DO NOT ask the user for information that can be detected automatically.

---

# 5. INFORMATION THAT MUST BE ASKED

If setup requires information that cannot safely be inferred, ask the user.

Examples:

```text
Google Drive document ID
Google account authorization
OAuth consent
GDD document selection
project-specific configuration
```

If multiple Google Drive documents exist, ask the user to select the intended GDD.

Example:

```text
Google Drive setup required.

I found these candidate documents:

1. Game GDD
2. RPG Design Document
3. Game Design v2

Which document should be used as the project's primary GDD?
```

Do not guess.

---

# 6. NEVER REQUEST SECRETS IN CHAT UNNECESSARILY

Do NOT ask users to paste:

- OAuth client secrets
- passwords
- access tokens
- private keys
- API keys

into normal chat if there is a safer supported authentication flow.

Prefer:

```text
OAuth browser authentication
local credential storage
environment variables
secret managers
provider-native authentication
```

If a credential must be configured manually, explain exactly where it should be placed without exposing it in logs.

Never print credentials.

Never commit credentials.

Never put secrets into Git.

---

# 7. BOOTSTRAP COMMAND

Create a portable bootstrap capability.

Conceptually:

```text
workflow bootstrap
```

or:

```text
/ai-workflow-setup
```

The exact command may differ per adapter.

It must perform:

```text
1. Detect project
2. Detect OS
3. Detect runtime dependencies
4. Detect installed providers
5. Detect agent adapter
6. Detect existing configuration
7. Detect GDD provider
8. Detect Google Drive integration
9. Install missing safe dependencies
10. Configure provider
11. Authenticate if required
12. Validate setup
13. Initialize project state
```

---

# 8. AUTOMATIC DEPENDENCY INSTALLATION

If a required dependency is missing and can safely be installed automatically:

DO IT.

Examples:

```text
Node package
Python package
small CLI utility
workflow package
local helper
```

Before installation:

- detect package manager
- detect project convention
- prefer existing project package manager
- avoid global installation when local installation is appropriate
- do not overwrite existing versions without checking compatibility

Example:

```text
npm
pnpm
yarn
pip
dotnet tool
```

Use the project's existing convention.

---

# 9. SYSTEM-LEVEL DEPENDENCIES

If a dependency requires:

- administrator privileges
- system package manager
- browser authentication
- GUI action
- manual account selection

the agent must explain the required action and ask the user only for the necessary step.

Do not pretend setup succeeded.

---

# 10. GOOGLE DRIVE PROVIDER

Create a provider abstraction.

```text
GDD Provider
    │
    ├── Google Drive
    ├── Local filesystem
    └── Future providers
```

The workflow itself must not depend directly on Google Drive APIs.

Define conceptual operations:

```text
getDocuments()
getMetadata(documentId)
getRevision(documentId)
getContent(documentId)
getChanges(documentId, sinceRevision)
```

---

# 11. GOOGLE DRIVE FIRST-RUN SETUP

When Google Drive is configured but not installed/setup:

```text
/design-sync
       ↓
Detect GDD provider
       ↓
Google Drive unavailable
       ↓
Bootstrap Google Drive
```

The agent should:

1. Detect whether a Google Drive MCP/provider already exists.
2. Detect whether required dependencies are installed.
3. Detect whether provider configuration already exists.
4. If missing and automatically installable, install/setup it.
5. If authentication is required, initiate the supported authentication flow.
6. If a GDD document ID is missing, ask the user.
7. If multiple candidate GDDs are found, ask the user to select.
8. Validate read access.
9. Store non-secret configuration.
10. Initialize `.ai/gdd-state.json`.
11. Continue with synchronization.

---

# 12. GOOGLE DRIVE CONFIGURATION

Store configuration separately from secrets.

Example:

```text
.ai/
└── config/
    └── gdd.yaml
```

Example:

```yaml
provider: google-drive

document:
  id: "..."
  name: "Game GDD"

sync:
  enabled: true
```

Do not store OAuth secrets in this file.

---

# 13. PROVIDER SETUP STATE

Create:

```text
.ai/
└── setup-state.json
```

Example:

```json
{
  "version": 1,

  "providers": {
    "google-drive": {
      "configured": true,
      "authenticated": true,
      "documentSelected": true
    }
  },

  "adapters": {
    "claude-code": {
      "configured": true
    }
  },

  "lastBootstrap": "..."
}
```

This allows future runs to skip unnecessary setup.

---

# 14. IDEMPOTENT BOOTSTRAP

Running setup multiple times must be safe.

Example:

```text
/ai-workflow-setup
```

first run:

```text
Installing dependency...
Configuring Google Drive...
Authentication required...
GDD selected...
Setup complete.
```

Second run:

```text
Dependencies: OK
Google Drive: OK
Authentication: OK
GDD: Game GDD
No setup required.
```

Never duplicate configuration.

Never reinstall unnecessarily.

---

# 15. BOOTSTRAP VALIDATION

After setup:

```text
Bootstrap Validation

Project root       ✓
Git                ✓
Workflow core      ✓
Agent adapter      ✓
GDD provider       ✓
Google Drive auth  ✓
GDD document       ✓
GDD access         ✓
Registry           ✓
State              ✓
```

Only then execute the requested workflow.

---

# 16. FAILURE HANDLING

If setup fails:

```text
SETUP INCOMPLETE

Reason:
Google Drive authentication is required.

Action:
Complete browser authentication and rerun the command.

Current state:
Project ✓
Workflow ✓
Google Drive provider ✓
Authentication ✗
GDD selection —
```

Do not continue as if setup succeeded.

---

# 17. PORTABLE PROJECT STRUCTURE

Create:

```text
game-ai-workflows/
│
├── README.md
│
├── skills/
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
├── contracts/
│   ├── FEATURE_SPEC.md
│   ├── DESIGN_CHANGE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── QA_REPORT.md
│   └── FEATURE_STATUS.md
│
├── schemas/
│   ├── feature.schema.json
│   ├── gdd.schema.json
│   ├── design-change.schema.json
│   ├── implementation-plan.schema.json
│   └── qa-report.schema.json
│
├── providers/
│   ├── google-drive/
│   ├── local/
│   └── generic/
│
├── agents/
│   ├── design-reviewer.md
│   ├── architect.md
│   ├── programmer.md
│   └── qa.md
│
├── adapters/
│   ├── claude-code/
│   ├── codex/
│   └── generic/
│
├── scripts/
│   ├── bootstrap/
│   ├── validate/
│   └── registry/
│
├── docs/
│   ├── architecture/
│   ├── workflows/
│   ├── setup/
│   └── examples/
│
└── tests/
    ├── registry/
    ├── validation/
    ├── bootstrap/
    └── workflows/
```

Integrate with the existing project instead of blindly creating duplicate structures.

---

# 18. PROJECT-SIDE STRUCTURE

The game repository should contain:

```text
docs/
│
├── gdd/
│   └── snapshots/
│
├── features/
│
├── registry/
│   ├── gdd.yaml
│   ├── features.yaml
│   └── systems.yaml
│
└── design-changes/
```

And:

```text
.ai/
├── config/
│   └── gdd.yaml
│
├── gdd-state.json
│
├── setup-state.json
│
└── cache/
```

---

# 19. GDD REGISTRY

Create:

```text
docs/registry/gdd.yaml
```

Example:

```yaml
documents:

  - id: game-gdd

    name: Game GDD

    provider: google-drive

    drive_file_id: "..."

    sections:

      - id: core-loop
        name: Core Loop

      - id: gameplay.defender-mode
        name: Defender Mode

      - id: gameplay.inventory
        name: Inventory
```

IDs must be stable.

Display names may change.

---

# 20. FEATURE REGISTRY

Create:

```text
docs/registry/features.yaml
```

Each feature should support:

```yaml
id:
name:
category:
status:

gdd:
  document:
  section:

spec:
  path:

systems:
  - ...

code:
  paths:
    - ...

tests:
  paths:
    - ...

dependencies:
  - ...

design_changes:
  - ...
```

Example:

```yaml
features:

  - id: gameplay.defender-mode

    name: Defender Mode

    category: gameplay

    status: verified

    gdd:
      document: game-gdd
      section: gameplay.defender-mode

    spec:
      path: docs/features/defender-mode/spec.md

    systems:
      - system.wave-spawner
      - system.target-detection
      - system.defender-mode

    dependencies: []
```

---

# 21. STABLE FEATURE IDS

Use:

```text
gameplay.defender-mode
gameplay.inventory
gameplay.equipment

system.wave-spawner
system.target-detection
system.inventory
```

Never use display names as machine identity.

If:

```text
Defender Mode
```

becomes:

```text
Defense Mode
```

the ID remains:

```text
gameplay.defender-mode
```

unless the underlying concept changes.

---

# 22. FEATURE LIFECYCLE

Implement:

```text
PLANNED
    ↓
DESIGN_REVIEW
    ↓
READY
    ↓
IN_PROGRESS
    ↓
IMPLEMENTED
    ↓
TESTING
    ↓
PLAYTEST
    ↓
VERIFIED
```

Also support:

```text
BLOCKED
NEEDS_REVIEW
DESIGN_CHANGED
DEPRECATED
CANCELLED
```

Document valid state transitions.

---

# 23. FEATURE SPEC

Each feature:

```text
docs/features/<feature-id>/
```

should contain:

```text
spec.md
implementation-plan.md
qa-report.md
changelog.md
```

`spec.md`:

```text
# Feature

## Identity

## GDD Source

## Purpose

## Design Requirements

## Gameplay Rules

## Technical Constraints

## Systems

## Dependencies

## Acceptance Criteria

## Tests

## Risks

## Open Questions
```

---

# 24. DESIGN CHANGE SYSTEM

Create:

```text
docs/design-changes/
```

Each change must contain:

```text
ID
Source GDD
Previous revision
Current revision
Changed section
Old behavior
New behavior
Impact
Affected features
Affected systems
Affected code
Affected tests
Status
```

Example:

```text
DC-001

Old:
Wave delay = 5 seconds

New:
Wave delay = 3 seconds

Affected:
gameplay.defender-mode
system.wave-spawner
system.wave-transition
```

---

# 25. GDD STATE

Create:

```text
.ai/gdd-state.json
```

Example:

```json
{
  "documents": {
    "game-gdd": {
      "driveFileId": "...",
      "lastKnownModifiedTime": "...",
      "lastKnownRevision": "...",
      "contentHash": "...",
      "lastSyncedAt": "..."
    }
  }
}
```

Do not fetch the entire GDD when metadata proves it has not changed.

---

# 26. GDD SNAPSHOTS

Store historical versions:

```text
docs/gdd/snapshots/
```

Example:

```text
rev-120.md
rev-124.md
```

or content-addressed equivalent.

---

# 27. DESIGN SYNC

Implement:

```text
/design-sync
```

Flow:

```text
Bootstrap
   ↓
Load state
   ↓
Check provider
   ↓
Check metadata
   ↓
Unchanged?
   │
 YES → STOP
   │
 NO
   ↓
Fetch revision
   ↓
Snapshot
   ↓
Diff
   ↓
Detect changed sections
   ↓
Update GDD Registry
   ↓
Map changes to features
   ↓
Create Design Changes
   ↓
Impact Analysis
   ↓
Report
```

Must be idempotent.

---

# 28. FEATURE DISCOVERY

Implement:

```text
/list-features
/find-feature
```

Support:

```text
/list-features
/list-features planned
/list-features in-progress
/list-features verified
```

And:

```text
/find-feature defender
/find-feature inventory
/find-feature "túi đồ"
```

Search:

- ID
- name
- aliases
- description
- GDD section

---

# 29. NEVER GUESS FEATURES

For:

```text
/implement-feature inventroy
```

DO NOT silently select inventory.

Return:

```text
Feature not found.

Possible matches:

1. gameplay.inventory
2. gameplay.equipment
```

Natural-language matching is allowed.

Final target must resolve to exactly one stable ID.

---

# 30. NEW FEATURE

Implement:

```text
/new-feature
```

It must:

- detect duplicate features
- propose stable ID
- create registry entry
- create feature directory
- create Feature Spec
- establish GDD mapping
- initialize lifecycle
- create acceptance criteria placeholder

---

# 31. DESIGN REVIEW

Implement:

```text
/review-design
```

Check:

- ambiguity
- contradictions
- missing rules
- missing edge cases
- missing acceptance criteria
- system conflicts
- technical risks

Never silently rewrite design.

---

# 32. DESIGN CHANGE REVIEW

Implement:

```text
/review-design-changes
```

Show pending changes.

Allow:

```text
approve
reject
defer
```

through the capabilities of the current agent.

Do not assume a specific UI.

---

# 33. FEATURE STATUS

Implement:

```text
/feature-status <feature>
```

Output:

```text
FEATURE STATUS

ID:
gameplay.inventory

GDD:
✓ Synced

Feature Spec:
✓ Exists

Design Changes:
✓ None

Implementation:
60%

Tests:
4 / 6

Playtest:
Pending

Current State:
IN_PROGRESS
```

---

# 34. FEATURE IMPACT

Implement:

```text
/feature-impact <feature>
```

Trace:

```text
GDD
 ↓
Feature
 ↓
Spec
 ↓
Systems
 ↓
Code
 ↓
Tests
 ↓
UI
 ↓
Design Changes
```

Report missing relationships.

---

# 35. SYSTEM REGISTRY

Create:

```text
docs/registry/systems.yaml
```

Example:

```yaml
systems:

  - id: system.wave-spawner

    name: Wave Spawner

    features:
      - gameplay.defender-mode

    code:
      - ...

    tests:
      - ...
```

Support reverse lookup:

```text
System → Feature → GDD
```

---

# 36. DESIGN PREFLIGHT

Before implementation:

```text
Feature resolution
       ↓
Bootstrap
       ↓
GDD sync check
       ↓
Design change check
       ↓
Feature Spec check
       ↓
Dependency check
       ↓
Architecture check
       ↓
Implementation plan
```

If design is stale:

```text
IMPLEMENTATION BLOCKED

GDD changed since Feature Spec revision.

Synchronize design first.
```

---

# 37. PLAN FEATURE

Implement:

```text
/plan-feature <feature>
```

Generate:

```text
docs/features/<feature>/implementation-plan.md
```

Include:

- current architecture
- affected systems
- new systems
- data/components
- code changes
- dependencies
- migration
- tests
- performance
- risks
- acceptance criteria
- implementation order

---

# 38. IMPLEMENT FEATURE

Implement:

```text
/implement-feature
/implement-feature <id>
```

Behavior:

### No argument

Show valid selectable features.

### Exact ID

Resolve immediately.

### Natural language

Resolve through registry.

### Typo

Suggest candidates.

### Ambiguous

Ask the user.

Before coding:

```text
Bootstrap
↓
Preflight
↓
Design validation
↓
Implementation plan
```

Then:

```text
Code
↓
Tests
↓
Validation
↓
Update status
```

Do not implement unrelated features.

---

# 39. TEST FEATURE

Implement:

```text
/test-feature <feature>
```

Perform:

- relevant test discovery
- test execution
- failure analysis
- missing-test detection
- feature mapping

Generate:

```text
qa-report.md
```

---

# 40. PLAYTEST

Implement:

```text
/playtest <feature>
```

Create structured playtest checklists.

Support:

- Unity MCP
- Unity CLI
- logs
- screenshots
- manual validation

If automation is unavailable, gracefully fall back to a manual checklist.

Never claim automated validation happened when it did not.

---

# 41. CLOSE FEATURE

Implement:

```text
/close-feature <feature>
```

Verify:

```text
Design
Spec
Implementation
Tests
Playtest
Acceptance Criteria
Changelog
Registry
```

Only then allow:

```text
VERIFIED
```

---

# 42. TRACEABILITY

Support:

```text
GDD → Feature
Feature → GDD
Feature → System
System → Feature
Feature → Code
Code → Feature
Feature → Tests
Tests → Feature
Feature → Design Change
Design Change → Feature
```

Prefer explicit registry mappings.

---

# 43. PORTABLE SKILLS

Every skill must have:

```text
SKILL.md
```

with:

```text
Purpose
Inputs
Required Context
Preconditions
Procedure
Validation
Outputs
Failure Behavior
```

Do NOT hardcode Claude-specific APIs into the portable skill.

Instead specify required capabilities:

```text
read files
write files
execute commands
query provider
resolve feature
ask user
```

Adapters provide those capabilities.

---

# 44. CLAUDE CODE ADAPTER

Create:

```text
adapters/claude-code/
```

Expose equivalent workflows.

Examples:

```text
/design-sync
/list-features
/find-feature
/new-feature
/review-design
/review-design-changes
/feature-status
/feature-impact
/plan-feature
/implement-feature
/test-feature
/playtest
/close-feature
```

Claude-specific configuration may exist ONLY inside this adapter.

---

# 45. CODEX ADAPTER

Create:

```text
adapters/codex/
```

Expose equivalent workflow capabilities.

Do not assume identical command syntax to Claude Code.

The portable workflow remains the source of truth.

---

# 46. GENERIC ADAPTER

Create:

```text
adapters/generic/
```

Provide generic CLI invocation.

Example:

```text
agent-workflow list-features
agent-workflow find-feature inventory
agent-workflow implement-feature gameplay.inventory
```

Exact command structure can follow existing project conventions.

---

# 47. AGENT ROLES

Create:

```text
agents/design-reviewer.md
agents/architect.md
agents/programmer.md
agents/qa.md
```

Roles:

### Design Reviewer

Design correctness.

### Architect

Architecture, scalability, performance.

### Programmer

Implementation.

### QA

Tests, regressions, acceptance criteria.

---

# 48. CONTRACTS

Create:

```text
contracts/FEATURE_SPEC.md
contracts/DESIGN_CHANGE.md
contracts/IMPLEMENTATION_PLAN.md
contracts/QA_REPORT.md
contracts/FEATURE_STATUS.md
```

---

# 49. JSON SCHEMAS

Create:

```text
schemas/feature.schema.json
schemas/gdd.schema.json
schemas/design-change.schema.json
schemas/implementation-plan.schema.json
schemas/qa-report.schema.json
```

---

# 50. VALIDATION

Create a standalone validator.

It must detect:

```text
duplicate IDs
broken references
missing specs
invalid states
invalid transitions
missing files
broken GDD links
broken system links
duplicate design changes
```

Provide a portable command such as:

```text
validate-workflow
```

It must work without Claude Code.

---

# 51. IDEMPOTENCY

All automation must be idempotent.

Examples:

Running:

```text
/design-sync
```

twice must not duplicate Design Changes.

Running:

```text
/ai-workflow-setup
```

twice must not duplicate configuration.

Running:

```text
/new-feature
```

must detect duplicates.

---

# 52. SAFE FAILURE

The system must fail safely.

Unknown feature:

```text
Do not guess.
```

Ambiguous feature:

```text
Ask.
```

Stale GDD:

```text
Block implementation.
```

Missing spec:

```text
Offer to create it.
```

Broken registry:

```text
Stop and report.
```

Pending design change:

```text
Show impact.
```

Missing tests:

```text
Do not mark VERIFIED.
```

---

# 53. NATURAL LANGUAGE UX

Support:

```text
Implement the inventory system.
```

Internally:

```text
inventory
 ↓
Feature Registry
 ↓
gameplay.inventory
```

The final operation must use:

```text
gameplay.inventory
```

---

# 54. GDD → FEATURE AUTO-DISCOVERY

When a new GDD section appears:

```text
New Design Section

Guild System

No matching feature found.

Suggested:

ID:
gameplay.guild

Name:
Guild System

Status:
PLANNED
```

Prefer approval before creating the feature.

---

# 55. FEATURE → SYSTEM DISCOVERY

During planning:

```text
Feature:
gameplay.inventory

Existing systems:
system.item
system.save-load

Potential new:
system.inventory
system.inventory-ui
```

Clearly distinguish:

```text
EXISTING
NEW
POTENTIAL
UNKNOWN
```

Never invent facts.

---

# 56. UNITY AWARENESS

The project is a Unity project.

The workflow must be capable of tracking:

- Unity ECS/DOTS
- Burst
- Jobs
- Unity Physics
- rendering
- memory
- GC
- networking
- server authority
- client/server architecture
- performance

But the portable core must remain generic.

Unity-specific rules belong to project configuration/documentation.

---

# 57. PROJECT AI RULES

Create:

```text
docs/architecture/AI_WORKFLOW_RULES.md
```

Rules:

```text
Feature Registry is the authoritative feature index.

Stable IDs are mandatory.

Never guess feature IDs.

GDD is the design source of truth.

Feature Spec is the engineering source of truth.

Git is engineering history.

Design changes must be traceable.

Stale design must not be silently implemented.

Verification requires evidence.

Bootstrap must run before workflows when dependencies are missing.
```

Integrate these rules into:

```text
CLAUDE.md
```

when appropriate, but keep the actual portable rules outside Claude-specific configuration.

---

# 58. README

Create comprehensive documentation explaining:

- architecture
- installation
- first-run bootstrap
- Google Drive setup
- authentication
- feature lifecycle
- GDD synchronization
- design changes
- Feature Registry
- commands
- Claude adapter
- Codex adapter
- generic adapter
- provider abstraction
- validation
- troubleshooting
- examples

---

# 59. TESTS

Create tests for:

```text
registry parsing
feature lookup
typo handling
ambiguous lookup
GDD validation
duplicate IDs
design change detection
state transitions
broken references
idempotency
bootstrap
provider detection
setup state
```

At minimum test:

```text
inventory
inventroy
defender
unknown-feature
```

And bootstrap scenarios:

```text
all dependencies installed
Google Drive missing
Google Drive installed but unauthenticated
authenticated but GDD not selected
GDD selected and valid
second bootstrap run
```

---

# 60. FIRST-RUN UX EXAMPLE

The final system should support this experience:

User:

```text
/design-sync
```

Agent:

```text
Checking workflow environment...

Workflow core        ✓
Project               ✓
Google Drive provider ✗

Google Drive integration is required for this workflow.

I can set it up automatically.

Proceeding with installation...
```

If authentication is needed:

```text
Google Drive authentication required.

Please complete the browser authentication flow.

No credentials will be stored in the repository.
```

After authentication:

```text
Google Drive connected ✓

I found these candidate documents:

1. Game GDD
2. RPG Design
3. Game Design v2

Select the primary GDD.
```

After selection:

```text
GDD:
Game GDD

Access:
✓

Revision:
124

Initial synchronization starting...
```

Then continue:

```text
GDD Registry ✓
Feature Registry ✓
Snapshot ✓
Design Diff ✓

No design changes detected.

Design synchronization complete.
```

---

# 61. DO NOT ASK UNNECESSARY QUESTIONS

The agent must follow this principle:

```text
Detect → Auto Setup → Ask Only What Is Necessary
```

Do not ask:

```text
What OS are you using?
```

if it can detect the OS.

Do not ask:

```text
Is Google Drive installed?
```

if it can inspect the environment.

Do not ask:

```text
What is your project root?
```

if the current repository can be detected.

Only ask when human input is genuinely required.

---

# 62. SECURITY

Never:

- commit credentials
- print secrets
- put tokens into Markdown
- put OAuth secrets into YAML committed to Git
- store passwords in project files
- expose authentication headers in logs

Use `.gitignore` for local secret/config files when required.

Provide safe templates where appropriate.

---

# 63. OFFLINE MODE

Everything that does not require Google Drive should work offline.

For example:

```text
/list-features
/find-feature
/feature-status
/feature-impact
/plan-feature
/test-feature
validate-workflow
```

should not require Google Drive if local registry/state is already available.

If the workflow needs current GDD data and the provider is unavailable:

```text
OFFLINE / STALE DATA

Current GDD cannot be verified.

Last known revision:
124

Do you want to continue using the last synchronized snapshot?
```

Do not silently use stale design for operations that require current design.

---

# 64. PROVIDER-AGNOSTIC DESIGN

Google Drive is the first provider.

Do not make it the only possible provider.

Future providers should be possible:

```text
Google Drive
Notion
Git
Local Markdown
Confluence
Other
```

The workflow should depend on:

```text
GDD Provider Interface
```

not:

```text
Google Drive API
```

---

# 65. IMPLEMENTATION PHASES

Implement in this order.

## Phase 1 — Foundation

```text
Portable skill format
Contracts
Schemas
Registry
Validator
Bootstrap
```

## Phase 2 — Feature System

```text
Feature Registry
Feature lifecycle
Feature Spec
list-features
find-feature
new-feature
feature-status
feature-impact
```

## Phase 3 — Provider/GDD

```text
Provider abstraction
Google Drive provider
GDD Registry
GDD state
Snapshots
Design Sync
Design Changes
Impact Analysis
```

## Phase 4 — Development Workflow

```text
review-design
review-design-changes
plan-feature
implement-feature
test-feature
playtest
close-feature
```

## Phase 5 — Adapters

```text
Claude Code
Codex
Generic CLI
```

## Phase 6 — Validation

```text
bootstrap tests
registry tests
workflow tests
idempotency tests
provider tests
```

---

# 66. INSPECT BEFORE MODIFYING

Before creating or modifying anything:

1. Inspect repository structure.
2. Inspect existing docs.
3. Inspect existing `.claude`.
4. Inspect existing agent configuration.
5. Inspect existing MCP configuration.
6. Inspect existing Google Drive integration.
7. Inspect existing scripts.
8. Inspect package managers.
9. Inspect test framework.
10. Inspect Git configuration.
11. Identify existing conventions.
12. Identify conflicts.

Do not overwrite existing architecture blindly.

Integrate whenever possible.

---

# 67. DO NOT STOP AT DOCUMENTATION

This is an implementation task.

Actually create:

- files
- scripts
- schemas
- validators
- registry
- providers
- portable skills
- adapters
- tests
- bootstrap
- documentation

The final result must be executable/useable.

---

# 68. DO NOT OVERENGINEER

Prefer:

```text
Markdown
YAML
JSON
JSON Schema
small deterministic scripts
CLI
portable provider interfaces
```

Avoid a database unless there is a demonstrated need.

Git should remain the primary history mechanism.

---

# 69. FINAL ARCHITECTURE

The final system should resemble:

```text
                         GOOGLE DRIVE
                              │
                              ▼
                       GDD PROVIDER
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
              │                            │                    │
              ▼                            ▼                    ▼
       FEATURE DISCOVERY             DESIGN REVIEW       IMPACT ANALYSIS
              │                            │                    │
              └────────────────────────────┼────────────────────┘
                                           ▼
                                      FEATURE SPEC
                                           │
                                           ▼
                                  IMPLEMENTATION PLAN
                                           │
                                           ▼
                                       PREFLIGHT
                                           │
                                           ▼
                                    IMPLEMENTATION
                                           │
                                           ▼
                                         TEST
                                           │
                                           ▼
                                       PLAYTEST
                                           │
                                           ▼
                                       VERIFY
                                           │
                                           ▼
                                      CHANGELOG
                                           │
                                           ▼
                                   FEATURE REGISTRY
```

Agent layer:

```text
                  PORTABLE WORKFLOW
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Claude          Codex         Generic
       Adapter         Adapter       Adapter
          │              │              │
          ▼              ▼              ▼
     Claude Code     Codex CLI      Other Agents
```

Bootstrap layer:

```text
Any Agent
    │
    ▼
Bootstrap
    │
    ├── Dependency detection
    ├── Provider detection
    ├── Auto installation
    ├── Authentication
    ├── Configuration
    ├── GDD selection
    └── Validation
             │
             ▼
       Workflow Execution
```

---

# 70. SUCCESS CRITERIA

The implementation is complete only when:

- [ ] Portable workflow core exists.
- [ ] Bootstrap exists.
- [ ] Automatic dependency detection exists.
- [ ] Automatic safe dependency installation exists.
- [ ] Google Drive provider exists.
- [ ] Google Drive first-run setup exists.
- [ ] Authentication flow is supported.
- [ ] Missing configuration is detected.
- [ ] Required user information is requested only when necessary.
- [ ] Secrets are handled safely.
- [ ] Setup is idempotent.
- [ ] Offline workflows work.
- [ ] GDD Registry exists.
- [ ] Feature Registry exists.
- [ ] Stable IDs exist.
- [ ] Feature lifecycle exists.
- [ ] Feature Specs exist.
- [ ] GDD state tracking exists.
- [ ] GDD snapshots exist.
- [ ] Design diff exists.
- [ ] Design Changes exist.
- [ ] Impact Analysis exists.
- [ ] `/list-features` exists.
- [ ] `/find-feature` exists.
- [ ] `/new-feature` exists.
- [ ] `/review-design` exists.
- [ ] `/review-design-changes` exists.
- [ ] `/feature-status` exists.
- [ ] `/feature-impact` exists.
- [ ] `/plan-feature` exists.
- [ ] `/implement-feature` exists.
- [ ] `/test-feature` exists.
- [ ] `/playtest` exists.
- [ ] `/close-feature` exists.
- [ ] Typo handling works.
- [ ] Ambiguous lookup works.
- [ ] Unknown features are never guessed.
- [ ] Stale GDD can block implementation.
- [ ] Registry validation works.
- [ ] Workflow is idempotent.
- [ ] Claude adapter exists.
- [ ] Codex adapter exists.
- [ ] Generic adapter exists.
- [ ] Portable skills contain no Claude-specific assumptions.
- [ ] Documentation exists.
- [ ] Automated tests exist.
- [ ] Example features exist.
- [ ] Existing project functionality was preserved.

---

# 71. FINAL EXECUTION REQUIREMENT

Do not merely describe the implementation.

Inspect the repository and implement it.

Work incrementally.

After each major phase:

1. Validate.
2. Run tests.
3. Fix issues.
4. Continue.

Do not leave partially implemented fake interfaces.

If a provider cannot be fully implemented because external credentials are unavailable:

- implement the provider abstraction
- implement the setup/bootstrap flow
- implement detection
- implement configuration
- provide the required authentication step
- clearly report what remains user-dependent

Do not fake successful authentication or GDD access.

---

# 72. FINAL REPORT

At completion provide:

```text
IMPLEMENTATION SUMMARY

Architecture:
...

Portable Core:
...

Bootstrap:
...

Google Drive:
...

Feature Registry:
...

GDD Registry:
...

Skills:
...

Claude Adapter:
...

Codex Adapter:
...

Generic Adapter:
...

Files Created:
...

Files Modified:
...

Tests:
...

Validation:
...

Known Limitations:
...

User Actions Still Required:
...

Example Commands:
...

Next Recommended Step:
...
```

Most importantly:

**The final product is a portable AI development workflow system. Claude Code is only one adapter. Google Drive is only one GDD provider. The workflow itself must remain independent from both.**

Core principle:

```text
DETECT
   ↓
AUTO SETUP
   ↓
ASK ONLY WHEN NECESSARY
   ↓
VALIDATE
   ↓
SYNC DESIGN
   ↓
RESOLVE FEATURE
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
PLAYTEST
   ↓
VERIFY
   ↓
TRACEABILITY
```