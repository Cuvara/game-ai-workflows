# Installation

## Option 1: MCP Plugin (Claude Code / AI Agents)

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "game-ai-workflows": {
      "command": "npx",
      "args": ["-y", "game-ai-workflows@latest", "mcp"]
    }
  }
}
```

This exposes workflow tools directly to Claude Code. No manual setup needed.

Available MCP tools:
- `workflow_bootstrap` — Initialize environment
- `workflow_validate` — Validate registries
- `workflow_list_features` — List features
- `workflow_find_feature` — Find feature (fuzzy/typo-tolerant)
- `workflow_feature_status` — Feature status
- `workflow_feature_impact` — Feature relationship tracing
- `workflow_preflight` — Pre-implementation design check
- `workflow_design_changes` — List design changes
- `workflow_system_trace` — System<->Feature tracing
- `workflow_discover_unmapped` — Find GDD sections without features

## Option 2: Full Install (Slash Commands + Scripts)

```bash
npx game-ai-workflows init
```

Or target a specific project:

```bash
npx game-ai-workflows init /path/to/your-game
```

This copies:
- `.claude/commands/` — 15 slash commands for Claude Code
- `scripts/` — Core workflow scripts
- `providers/` — GDD provider abstraction
- `schemas/` — JSON schemas
- `contracts/` — Document templates
- `skills/` — Portable skill definitions
- `adapters/` — Agent adapters
- `agents/` — Agent role definitions
- Registry templates and project structure

After install, use in Claude Code:
- `/ai-workflow-setup` — Bootstrap
- `/list-features` — List features
- `/find-feature <query>` — Find feature
- etc.

## Option 3: Global CLI

```bash
npm install -g game-ai-workflows

# Then use anywhere:
game-ai-workflows bootstrap
game-ai-workflows list-features
game-ai-workflows find-feature inventory
```

## Option 4: npx (No Install)

```bash
npx game-ai-workflows bootstrap
npx game-ai-workflows list-features
npx game-ai-workflows find-feature inventory
```

## Environment Variable

Set `GAME_AI_WORKFLOWS_ROOT` to override the project root detection:

```bash
export GAME_AI_WORKFLOWS_ROOT=/path/to/your-game
```
