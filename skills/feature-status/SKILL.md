# Feature Status

## Purpose

Show the comprehensive status of a single feature across all workflow dimensions.

## Inputs

- **Feature ID** (required): the ID of the feature to inspect.

## Required Context

- Feature registry
- GDD state (sync status)
- Feature spec

## Preconditions

- Feature exists in the registry.

## Required Capabilities

- read files
- resolve feature

## Procedure

1. Resolve the feature ID to a registry entry.
2. Check GDD sync status for the feature's mapped section.
3. Check whether the feature spec exists and is populated.
4. Check for any pending design changes affecting this feature.
5. Check implementation progress (files created, plan completion).
6. Check test status (tests exist, pass/fail state).
7. Check playtest status (checklist completion).
8. Compile all findings into a lifecycle state report.

## Validation

- Feature resolved to exactly one registry entry.

## Outputs

- Formatted status report covering: lifecycle state, GDD sync, spec completeness, design changes, implementation progress, test results, and playtest status.

## Failure Behavior

- Feature not found: report that no feature matches the given ID and suggest candidate matches using fuzzy search.
