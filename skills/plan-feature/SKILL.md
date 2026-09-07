---
name: plan-feature
description: >
  Generate implementation plan: architecture, affected systems, code changes, dependencies, tests, risks, acceptance criteria, implementation order.
---

# Plan Feature

## Purpose

Generate a detailed implementation plan for a feature based on its spec and the current codebase.

## Inputs

- **Feature ID** (required): the ID of the feature to plan.

## Required Context

- Feature spec
- System registry
- Codebase (source files)

## Preconditions

- Feature is in READY or later lifecycle state.
- Feature spec exists and is populated.

## Required Capabilities

- read files
- write files
- search codebase

## Procedure

1. Load the feature spec.
2. Analyze the current project architecture and conventions.
3. Identify existing systems affected by this feature.
4. Identify any new systems or components that need to be created.
5. Plan specific code changes (files to create, modify, or extend).
6. Identify dependencies between changes (ordering constraints).
7. Plan any required data migration or configuration changes.
8. Plan test strategy (unit tests, integration tests, feature tests).
9. Assess performance implications.
10. Assess risks and mitigation strategies.
11. Define concrete acceptance criteria derived from the spec.
12. Order implementation steps into a logical sequence.
13. Write the plan to the feature directory.

## Validation

- Plan covers all requirements defined in the feature spec.

## Outputs

- `implementation-plan.md` written to the feature directory.

## Failure Behavior

- Spec missing: offer to create the spec via the new-feature skill.
- Design stale (pending unresolved design changes): block planning and report that design changes must be resolved first.
