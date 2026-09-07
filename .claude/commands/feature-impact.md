Trace all relationships for a feature.

Usage: /feature-impact <feature>

Arguments: $ARGUMENTS (feature ID or name)

1. Resolve feature
2. Run: `node scripts/registry/system-lookup.mjs trace-feature $ARGUMENTS`
3. Also run: `node adapters/generic/agent-workflow.mjs feature-impact $ARGUMENTS`
4. Report: GDD → Feature → Spec → Systems → Code → Tests → Design Changes
5. Flag any missing relationships
