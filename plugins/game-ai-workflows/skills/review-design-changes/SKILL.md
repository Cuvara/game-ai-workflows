# Review Design Changes

## Purpose

Show pending design changes from GDD syncs and allow the user to resolve them (approve, reject, or defer).

## Inputs

- **Feature filter** (optional): limit displayed changes to a specific feature.

## Required Context

- Design changes directory

## Preconditions

- Design change records exist from a previous design-sync.

## Required Capabilities

- read files
- write files
- ask user

## Procedure

1. Load all pending design change records.
2. If a feature filter is provided, narrow to changes affecting that feature.
3. Display a summary of all pending changes (count, affected features, severity).
4. For each pending change:
   a. Show what changed (old value vs. new value).
   b. Show the impact on affected features and systems.
   c. Accept the user's action: approve, reject, or defer.
5. Record the user's decision for each change.
6. Update design change statuses accordingly.

## Validation

- All user actions recorded and persisted.
- No pending change left in an inconsistent state.

## Outputs

- Updated design change records with resolved statuses (approved, rejected, deferred).

## Failure Behavior

- No pending changes: report that there are no pending design changes (clean state).
- Corrupted change record: report the specific record and skip it, processing remaining changes.
