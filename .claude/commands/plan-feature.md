Generate implementation plan for a feature.

Read `skills/plan-feature/SKILL.md` for the full procedure.

Arguments: $ARGUMENTS (feature ID)

1. Resolve feature and verify spec exists
2. Run preflight: `node scripts/preflight/preflight.mjs $ARGUMENTS`
3. If preflight fails, report blockers and stop
4. Read feature spec from `docs/features/<id>/spec.md`
5. Discover systems: `node scripts/discovery/gdd-discovery.mjs systems $ARGUMENTS`
6. Analyze current architecture and dependencies
7. Write implementation plan to `docs/features/<id>/implementation-plan.md` using `contracts/IMPLEMENTATION_PLAN.md` template
8. Update feature status to READY if currently PLANNED
