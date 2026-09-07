Review feature design for completeness and consistency.

Read `skills/review-design/SKILL.md` for the full procedure.

Arguments: $ARGUMENTS (feature ID)

1. Resolve feature: `node adapters/generic/agent-workflow.mjs find-feature $ARGUMENTS`
2. Read the feature spec from `docs/features/<id>/spec.md`
3. Check for: ambiguity, contradictions, missing rules, missing edge cases, missing acceptance criteria, system conflicts, technical risks
4. Report findings categorized by severity
5. Never silently rewrite design — report issues only
