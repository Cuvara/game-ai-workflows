# Claude Code Skill Loader

## How Skills Work in Claude Code

Each slash command corresponds to a portable skill in `skills/<skill-name>/SKILL.md`.

When a skill is invoked:

1. Claude Code reads the SKILL.md to understand the procedure
2. The adapter provides capability implementations
3. Claude Code executes the procedure using its native tools (Read, Write, Edit, Bash, etc.)
4. Results are formatted and presented to the user

## Capability Mapping

| Portable Capability | Claude Code Tool |
|---------------------|------------------|
| read files | Read tool |
| write files | Write / Edit tools |
| execute commands | Bash tool |
| query provider | MCP tools (Google Drive, etc.) |
| resolve feature | feature-lookup.mjs |
| ask user | Direct conversation |
| search codebase | Grep / Glob tools |

## Skill Registration

Skills are registered as Claude Code custom slash commands.
See the individual skill SKILL.md files for procedure details.
