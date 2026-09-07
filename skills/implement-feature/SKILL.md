---
name: implement-feature
description: >
  Implement feature following its plan. Runs preflight, validates design currency, follows implementation order. Blocks on stale GDD.
---

# Implement Feature

## Purpose

Implement a feature by following its implementation plan, writing code, and running tests.

## Inputs

- **Feature ID** (optional): the ID of the feature to implement. If omitted, display a selectable list of features ready for implementation.

## Required Context

- Implementation plan (implementation-plan.md)
- Feature spec

## Preconditions

- Implementation plan exists for the feature.
- Design is current (no unresolved design changes).
- Preflight checks pass (environment ready, dependencies available).

## Required Capabilities

- read files
- write files
- execute commands
- search codebase
- resolve feature

## Procedure

1. If no feature ID provided, list features eligible for implementation and let the user select one.
2. Resolve the feature to its registry entry.
3. Run bootstrap validation to confirm environment readiness.
4. Run preflight checks (dependencies installed, build tools available).
5. Validate that the feature's design is current (no pending design changes).
6. Load the implementation plan.
7. Implement code changes following the plan step by step.
8. Write test files as specified in the plan.
9. Run tests and verify they pass.
10. Update the feature registry status to reflect implementation progress.
11. Update the system registry if new systems were created or modified.

## Validation

- All tests pass.
- Feature registry updated to reflect the new status.

## Outputs

- Code changes (new and modified source files).
- Test files.
- Updated feature registry and system registry.

## Failure Behavior

- Preflight fails: report which checks failed and what blockers must be resolved before implementation can proceed.
- Design stale: block implementation and report that design changes must be resolved first.
- Tests fail: report failures, do not update registry status to a passing state.
