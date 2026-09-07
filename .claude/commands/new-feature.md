Create a new feature with stable ID and scaffolding.

Read `skills/new-feature/SKILL.md` for the full procedure.

Arguments: $ARGUMENTS (feature name or description)

Steps:
1. Check registry for duplicates: `node adapters/generic/agent-workflow.mjs find-feature $ARGUMENTS`
2. If duplicate found, report it and stop
3. Propose stable ID in category.name format (e.g., gameplay.inventory)
4. Ask user to confirm ID and category
5. Create feature directory: `docs/features/<id>/`
6. Create spec from template: copy `contracts/FEATURE_SPEC.md` and fill identity fields
7. Add entry to `docs/registry/features.yaml` with status: PLANNED
8. Report created files

Never create a feature without user confirmation of the ID.
