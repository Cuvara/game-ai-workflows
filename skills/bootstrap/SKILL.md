# Bootstrap

## Purpose

Initialize and validate the workflow environment by detecting the project structure, operating system, available runtimes, configuration, and providers. Ensures all required directories and registries exist and are properly initialized.

## Inputs

None. This skill auto-detects all required information from the environment.

## Required Context

- Project root directory
- Operating system

## Preconditions

None. This is the first skill that should run in any workflow.

## Required Capabilities

- read files
- write files
- execute commands

## Procedure

1. Detect the project root directory.
2. Detect the operating system and platform details.
3. Detect available runtimes (e.g., game engine, language runtimes, build tools).
4. Detect project configuration files and parse settings.
5. Detect configured providers (e.g., GDD source, version control).
6. Ensure all required directories exist; create any that are missing.
7. Ensure all registries exist (feature registry, system registry, GDD registry); create empty registries if missing.
8. Initialize workflow state (setup-state.json).
9. Validate that all checks pass and the environment is ready.

## Validation

All detection and initialization checks pass without errors. The environment is confirmed ready for downstream skills.

## Outputs

- `setup-state.json` updated with detected environment details.
- All registries initialized and accessible.

## Failure Behavior

Report exactly which check failed with an actionable fix. For example:
- Missing runtime: report the runtime name and installation instructions.
- Missing configuration: report which config file is expected and where.
- Permission error: report the path and required permissions.
