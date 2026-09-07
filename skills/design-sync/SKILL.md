# Design Sync

## Purpose

Synchronize the Game Design Document (GDD) from the configured provider, create snapshots, and detect changes since the last sync.

## Inputs

None. Uses provider configuration from project settings.

## Required Context

- GDD provider configured (e.g., Google Docs, Notion, local file)
- Authentication credentials valid for the provider

## Preconditions

- Bootstrap complete (setup-state.json exists and is valid).
- GDD provider is available and reachable.

## Required Capabilities

- read files
- write files
- query provider
- execute commands

## Procedure

1. Load current workflow state.
2. Check provider connectivity and authentication.
3. Check GDD metadata (last modified timestamp, version hash).
4. If metadata is unchanged since last sync, STOP and report no changes.
5. Fetch full GDD content from the provider.
6. Save a timestamped snapshot of the fetched content.
7. Diff the new snapshot against the previous snapshot.
8. Detect which GDD sections have changed.
9. Update the GDD registry with current section metadata.
10. Map detected changes to affected features via GDD-to-feature mappings.
11. Create design change records for each affected feature.
12. Perform impact analysis across affected features and systems.
13. Generate and report a summary of all changes and their impact.

## Validation

- Snapshot saved successfully to the snapshots directory.
- All detected changes recorded as design change entries.

## Outputs

- GDD snapshot file (timestamped).
- Design change records in the design-changes directory.
- Impact report summarizing what changed and what is affected.

## Failure Behavior

- Provider unavailable: report offline state, preserve last-known snapshot, and suggest retrying later.
- Authentication failed: prompt for re-authentication or credential refresh.
- Partial fetch: report which sections were retrieved and which failed.
