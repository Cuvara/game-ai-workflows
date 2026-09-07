Run and analyze tests for a feature.

Read `skills/test-feature/SKILL.md` for the full procedure.

Arguments: $ARGUMENTS (feature ID)

1. Resolve feature
2. Find test files from feature's registry entry (tests.paths)
3. Run discovered tests
4. Analyze failures
5. Detect missing test coverage
6. Generate QA report at `docs/features/<id>/qa-report.md` using `contracts/QA_REPORT.md` template
7. Update feature status to TESTING
