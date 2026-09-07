---
name: list-features
description: >
  List all features from the registry with optional status filter. Shows ID, name, status, category.
---

# List Features

## Purpose

List features from the feature registry with an optional status filter.

## Inputs

- **Status filter** (optional): filter features by lifecycle status (e.g., PLANNED, READY, IN_PROGRESS, IMPLEMENTED, VERIFIED).

## Required Context

- Feature registry file

## Preconditions

- Feature registry exists and is parseable.

## Required Capabilities

- read files

## Procedure

1. Load the feature registry.
2. If a status filter is provided, filter features to only those matching the specified status.
3. Format the output as a list showing each feature's ID, name, and current status.

## Validation

- Feature registry is parseable and contains valid entries.

## Outputs

- Formatted feature list with columns: ID, name, status.

## Failure Behavior

- Registry missing: report that the registry does not exist and suggest running bootstrap.
- Registry corrupted: report the parse error and suggest manual inspection or re-bootstrap.
