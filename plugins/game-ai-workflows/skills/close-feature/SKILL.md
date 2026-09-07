# Close Feature

## Purpose

Verify that all workflow stages are complete for a feature and mark it as VERIFIED.

## Inputs

- **Feature ID** (required): the ID of the feature to close.

## Required Context

- All registries (feature, GDD, system)
- Feature spec
- Test results
- Playtest results

## Preconditions

- Feature is implemented (code exists).

## Required Capabilities

- read files
- write files
- resolve feature

## Procedure

1. Verify the GDD is synced and the feature's mapped section is current.
2. Verify the feature spec exists and is complete.
3. Verify implementation is complete (all planned code changes applied).
4. Verify tests exist and are passing.
5. Verify playtest is complete (all checklist items addressed).
6. Verify all acceptance criteria are met.
7. Update the project changelog with the feature's completion entry.
8. Update the feature registry status to VERIFIED.

## Validation

- All verification checks pass before the status is updated.

## Outputs

- Feature status updated to VERIFIED in the registry.
- Changelog updated with the feature completion entry.

## Failure Behavior

- Any verification check fails: report exactly which checks did not pass and what is missing. Do not mark the feature as VERIFIED. The feature remains in its current status until all checks pass.
