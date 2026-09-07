---
name: test-feature
description: >
  Discover, run, and analyze tests for a feature. Detect missing coverage. Generate QA report.
---

# Test Feature

## Purpose

Run and analyze tests for a specific feature, identifying failures and coverage gaps.

## Inputs

- **Feature ID** (required): the ID of the feature to test.

## Required Context

- Feature registry
- Test files associated with the feature

## Preconditions

- Feature has an implementation (code files exist).

## Required Capabilities

- read files
- write files
- execute commands
- search codebase

## Procedure

1. Discover all test files associated with the feature (by convention, mapping, or search).
2. Execute the discovered tests using the project's test runner.
3. Analyze test results, categorizing passes and failures.
4. Detect missing test coverage by comparing tested behavior against the feature spec and acceptance criteria.
5. Map test coverage back to the feature's requirements.
6. Generate a QA report summarizing results, coverage, and gaps.

## Validation

- All discovered tests were executed (none skipped without cause).

## Outputs

- `qa-report.md` written to the feature directory, containing: test results summary, failure details, coverage analysis, and identified gaps.

## Failure Behavior

- No tests found: report that no tests exist for this feature and suggest creating them.
- Test runner unavailable: report that the test runner could not be found or executed, and suggest checking the environment setup.
- Partial execution: report which tests ran and which could not be executed.
