Show comprehensive status of a feature.

Usage: /feature-status <feature>

Arguments: $ARGUMENTS (feature ID or name)

1. Resolve feature: `node adapters/generic/agent-workflow.mjs find-feature $ARGUMENTS`
2. Run: `node adapters/generic/agent-workflow.mjs feature-status $ARGUMENTS`
3. Also check:
   - Spec exists: `docs/features/<id>/spec.md`
   - Implementation plan exists: `docs/features/<id>/implementation-plan.md`
   - Pending design changes: `node scripts/registry/design-change.mjs list PENDING` (grep for feature ID)
   - QA report: `docs/features/<id>/qa-report.md`
4. Format as comprehensive status report
