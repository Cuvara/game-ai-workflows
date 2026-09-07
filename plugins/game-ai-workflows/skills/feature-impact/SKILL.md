# Feature Impact

## Purpose

Trace all relationships and dependencies for a feature across the entire project.

## Inputs

- **Feature ID** (required): the ID of the feature to trace.

## Required Context

- All registries (feature, GDD, system)

## Preconditions

- Feature exists in the registry.

## Required Capabilities

- read files
- search codebase
- resolve feature

## Procedure

1. Resolve the feature ID to a registry entry.
2. Trace GDD mapping: which GDD sections relate to this feature.
3. Trace feature spec: what the spec defines.
4. Trace system dependencies: which systems this feature touches.
5. Trace code references: which source files implement this feature.
6. Trace test coverage: which tests validate this feature.
7. Trace UI references: which UI elements relate to this feature.
8. Trace design changes: any pending or resolved changes affecting this feature.
9. Report any missing or broken relationships in the traceability chain.

## Validation

- Traceability chain is complete from GDD through to tests.

## Outputs

- Impact graph showing each link (GDD, spec, systems, code, tests, UI, design changes) with the status of each (present, missing, stale).

## Failure Behavior

- Feature not found: report that no feature matches the given ID and suggest candidate matches.
