---
name: playtest
description: >
  Create structured playtest checklist. Supports automation when available, falls back to manual. Never claims automated validation that didn't happen.
---

# Playtest

## Purpose

Create and track a playtest session for a feature, combining automated checks with manual verification where needed.

## Inputs

- **Feature ID** (required): the ID of the feature to playtest.

## Required Context

- Feature spec
- Acceptance criteria

## Preconditions

- Feature is implemented.
- Tests are passing.

## Required Capabilities

- read files
- write files
- execute commands
- ask user

## Procedure

1. Load the feature's acceptance criteria from the spec.
2. Check for automation availability (e.g., Unity MCP, CLI test tools, simulation harness).
3. If automation is available:
   a. Run automated checks against each acceptance criterion that can be verified programmatically.
   b. Create a manual checklist for any remaining criteria that require human judgment.
4. If automation is not available:
   a. Create a full manual checklist covering all acceptance criteria.
5. Present the checklist to the user for completion.
6. Track checklist completion as the user marks items.
7. Update the feature status based on playtest results.

## Validation

- All checklist items addressed (passed, failed, or noted as blocked).

## Outputs

- Playtest checklist and report in the feature directory.

## Failure Behavior

- Automation unavailable: gracefully fall back to a fully manual checklist. Never claim automated validation that did not actually happen.
- Acceptance criteria missing: report that criteria are undefined and suggest updating the feature spec before playtesting.
