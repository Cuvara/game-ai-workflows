# New Feature

## Purpose

Create a new feature with a stable ID, registry entry, directory structure, and all required scaffolding.

## Inputs

- **Feature name** (required): human-readable name for the feature.
- **Category** (required): classification category for the feature.
- **GDD section** (optional): the GDD section this feature maps to.

## Required Context

- Feature registry
- GDD registry

## Preconditions

- Bootstrap complete (setup-state.json exists and is valid).

## Required Capabilities

- read files
- write files
- ask user

## Procedure

1. Check the feature registry for duplicates (by name or proposed ID).
2. Propose a stable feature ID based on the name and category.
3. Confirm the proposed ID with the user before proceeding.
4. Create the feature entry in the feature registry.
5. Create the feature directory under the features path.
6. Create a feature spec file from the appropriate template.
7. If a GDD section is provided, establish the GDD-to-feature mapping in the GDD registry.
8. Initialize the feature lifecycle status as PLANNED.
9. Create an acceptance criteria placeholder in the feature spec.

## Validation

- No duplicate feature IDs exist in the registry.
- Feature directory created successfully.
- Feature registry updated with the new entry.

## Outputs

- New entry in the feature registry.
- Feature spec file created from template.
- Feature directory with initial structure.

## Failure Behavior

- Duplicate detected: report the existing feature with its ID and name. Do not create a duplicate.
- Registry write failure: report the error and do not leave partial state.
