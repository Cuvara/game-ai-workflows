List features from the registry.

Usage: /list-features [status]

Arguments: $ARGUMENTS (optional status filter: PLANNED, IN_PROGRESS, READY, IMPLEMENTED, TESTING, PLAYTEST, VERIFIED, BLOCKED, etc.)

Execute: `node adapters/generic/agent-workflow.mjs list-features $ARGUMENTS`

If registry is empty, suggest running /ai-workflow-setup or populating from docs/examples/.
