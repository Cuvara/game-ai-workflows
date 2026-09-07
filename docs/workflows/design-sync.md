# Design Sync Workflow

## Overview

Synchronizes the Game Design Document (GDD) from its source provider,
creates snapshots, detects changes, and maps impact to features.

## Flow

```
Bootstrap check
     ↓
Load GDD state (.ai/gdd-state.json)
     ↓
Check provider availability
     ↓
Check document metadata
     ↓
Unchanged? → STOP (no work needed)
     ↓
Fetch current content
     ↓
Save snapshot (docs/gdd/snapshots/)
     ↓
Diff against previous snapshot
     ↓
Detect changed sections
     ↓
Update GDD Registry (docs/registry/gdd.yaml)
     ↓
Map changes to features (via section → feature mapping)
     ↓
Create Design Change records (docs/design-changes/)
     ↓
Impact Analysis (affected features, systems, code, tests)
     ↓
Report
```

## Idempotency

Running design-sync twice with no GDD changes produces no new artifacts.
Design change records are deduplicated by revision pair.

## Offline Behavior

If the GDD provider is unavailable:
- Report the offline state
- Show last known revision
- Ask user whether to proceed with cached data
- Never silently use stale design for operations requiring current design
