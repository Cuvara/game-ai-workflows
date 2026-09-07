# Find Feature

## Purpose

Find a feature by ID, name, alias, or fuzzy match against the feature registry.

## Inputs

- **Query string** (required): the search term to match against feature IDs, names, and aliases.

## Required Context

- Feature registry file

## Preconditions

- Feature registry exists and is parseable.

## Required Capabilities

- read files

## Procedure

1. Attempt exact match on feature ID.
2. If no exact ID match, attempt exact match on feature name (case-insensitive).
3. If no exact name match, attempt match on known aliases.
4. If no alias match, attempt partial/substring match on names and IDs.
5. If no partial match, attempt fuzzy match (edit distance, token overlap).
6. Report all matches found.

## Validation

- Results are coherent and relevant to the query string.

## Outputs

- **Exact match**: return the single matched feature with full details.
- **Multiple candidates**: return a ranked list of candidates and ask the user to disambiguate. Never silently guess.

## Failure Behavior

- No matches found: report that no features match the query and suggest checking spelling or listing all features.
- Ambiguous match: list all candidate features with their IDs and names, and ask the user to select one.
