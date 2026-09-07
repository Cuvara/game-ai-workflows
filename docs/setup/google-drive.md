# Google Drive Setup

## Overview

Google Drive is the default GDD provider. This document describes
how to configure Google Drive integration.

## Prerequisites

- Google account with access to the GDD document
- Google Drive MCP server (for Claude Code) or Google Drive API access

## First-Run Setup

When you run a workflow command (e.g., `/design-sync`) and Google Drive
is not configured, the bootstrap system will:

1. Detect that Google Drive MCP/provider is missing
2. Guide you through installation
3. Initiate authentication (browser-based OAuth)
4. List candidate GDD documents
5. Ask you to select the primary GDD
6. Validate access
7. Store configuration (non-secret) in `.ai/config/gdd.yaml`
8. Initialize GDD state in `.ai/gdd-state.json`

## Configuration

After setup, configuration is stored in:

```yaml
# .ai/config/gdd.yaml
provider: google-drive

document:
  id: "game-gdd"
  name: "Game GDD"
  drive_file_id: "1abc...xyz"

sync:
  enabled: true
```

## Security

- OAuth tokens are stored by the MCP server or system keychain
- No secrets are stored in `.ai/config/gdd.yaml`
- No credentials are committed to Git
- `.ai/` should be in `.gitignore` (cache and local state)

## Troubleshooting

### Authentication Failed
Re-run bootstrap. The system will detect the auth failure and re-initiate.

### Wrong Document Selected
Edit `.ai/config/gdd.yaml` and update the `drive_file_id`, or delete it and re-run bootstrap.

### MCP Not Available
Ensure Google Drive MCP is configured in your agent's MCP settings.
For Claude Code: check `.claude/settings.json` or `.claude/settings.local.json`.
