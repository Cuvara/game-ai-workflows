# Codex Adapter

Exposes the portable game design workflow for Codex CLI and Codex-style agents.

## Usage

Codex agents can invoke workflow operations through:

1. **Direct script execution**: `node scripts/bootstrap/bootstrap.mjs`
2. **CLI wrapper**: `node adapters/codex/codex-cli.mjs <command> [args]`
3. **Programmatic API**: Import from `adapters/codex/codex-adapter.mjs`

## Commands

```
codex-cli.mjs bootstrap          # Initialize environment
codex-cli.mjs list-features      # List all features
codex-cli.mjs find-feature <q>   # Find feature by query
codex-cli.mjs feature-status <id> # Show feature status
codex-cli.mjs validate           # Validate workflow state
```

## Configuration

Codex-specific settings can be placed in the Codex agent's configuration.
The portable workflow configuration stays in `.ai/`.
