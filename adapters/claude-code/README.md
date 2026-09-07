# Claude Code Adapter

Exposes the portable game design workflow as Claude Code slash commands.

## Commands

| Command | Skill | Description |
|---------|-------|-------------|
| /ai-workflow-setup | bootstrap | Initialize workflow environment |
| /design-sync | design-sync | Sync GDD from provider |
| /list-features | list-features | List features with optional filter |
| /find-feature | find-feature | Find feature by query |
| /new-feature | new-feature | Create new feature |
| /review-design | review-design | Review feature design |
| /review-design-changes | review-design-changes | Review pending design changes |
| /feature-status | feature-status | Show feature status |
| /feature-impact | feature-impact | Show feature impact |
| /plan-feature | plan-feature | Plan feature implementation |
| /implement-feature | implement-feature | Implement a feature |
| /test-feature | test-feature | Test a feature |
| /playtest | playtest | Playtest a feature |
| /close-feature | close-feature | Close/verify a feature |

## Configuration

Claude-specific configuration belongs in `.claude/` directory:
- `.claude/settings.json` - MCP servers, permissions
- `.claude/CLAUDE.md` - Agent instructions

The portable workflow configuration stays in `.ai/`.
