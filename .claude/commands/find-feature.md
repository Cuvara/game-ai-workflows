Find a feature by ID, name, or fuzzy match.

Usage: /find-feature <query>

Arguments: $ARGUMENTS (required - feature name, ID, or search term)

Execute: `node adapters/generic/agent-workflow.mjs find-feature $ARGUMENTS`

If ambiguous, show candidates and ask user to select.
Never silently guess — always confirm with user if multiple matches.
