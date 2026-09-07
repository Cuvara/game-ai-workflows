# Review Design

## Purpose

Review a feature's design for completeness, consistency, and readiness for implementation.

## Inputs

- **Feature ID** or **GDD section** (at least one required): identifies what to review.

## Required Context

- GDD content (current snapshot)
- Feature spec

## Preconditions

- Feature exists in the registry.
- GDD has been synced (snapshot is current).

## Required Capabilities

- read files
- search codebase

## Procedure

1. Load the relevant GDD section(s).
2. Load the feature spec.
3. Check for ambiguous requirements (vague language, undefined terms).
4. Check for contradictions between GDD and spec or within the spec itself.
5. Check for missing game rules or business logic.
6. Check for missing edge cases and boundary conditions.
7. Check for missing or incomplete acceptance criteria.
8. Check for conflicts with other systems or features.
9. Check for technical risks (performance, platform, dependency).
10. Generate a design review report with findings organized by severity.

## Validation

All review checks executed. Report generated even if no issues found.

## Outputs

- Design review report listing issues by category and severity (critical, warning, suggestion).

## Failure Behavior

- GDD stale (snapshot outdated): suggest running design-sync first before reviewing.
- Feature spec missing: report that the spec does not exist and suggest creating one via new-feature.
