---
name: generate-features
description: >
  Read all GDD documents and auto-generate features.yaml registry.
  Extracts sections from GDD, creates feature entries with stable IDs,
  preserves existing features. Commits, pushes, and uploads to Google Drive.
---

# Generate Features from GDD

## Purpose

When no features.yaml exists (or is empty) but GDD documents are available,
generate the feature registry automatically from GDD content. This ensures
all other commands (/list-features, /find-feature, etc.) work without manual
registry population.

## Inputs

- None required (reads from GDD sources automatically)

## Required Context

- GDD documents available via:
  - `docs/registry/gdd.yaml` (GDD registry with sections)
  - `docs/gdd/snapshots/*.md` (GDD snapshots)
  - `docs/gdd/*.md` (local GDD files)
- At least one GDD source must contain content

## Preconditions

- Bootstrap complete (docs/registry/ directory exists)

## Required Capabilities

- read files
- write files
- execute commands
- ask user (for confirmation before commit/push)
- query provider (for Google Drive upload)

## Procedure

1. Run: `node scripts/registry/generate-features.mjs`
2. Review the generated `docs/registry/features.yaml`
3. Show user the list of created features and ask for confirmation
4. If user approves:
   - Stage: `git add docs/registry/features.yaml docs/features/`
   - Commit with descriptive message
   - Push to Git remote
5. If user wants changes: let them edit, then commit+push
6. **Google Drive upload** (if configured):
   - Check `.ai/config/gdd.yaml` for upload settings
   - If `upload.enabled: true` and provider is `google-drive`:
     - Read features.yaml content
     - If `upload.features_file_id` exists: update that file using
       `mcp__claude_ai_Google_Drive__update_file({ fileId, textContent })`
     - If no file ID: create new file using
       `mcp__claude_ai_Google_Drive__create_file({ title: "features.yaml", textContent, parentId: upload.folder_id })`
     - Save returned fileId to `.ai/config/gdd.yaml` for future updates
   - If upload not configured: skip (Git push is sufficient)

## Configuration

To enable Google Drive upload, edit `.ai/config/gdd.yaml`:

```yaml
provider: google-drive

upload:
  enabled: true
  folder_id: "your-google-drive-folder-id"
  # features_file_id: ""  # Set after first upload for updates
```

## Validation

- features.yaml is valid YAML
- All feature IDs follow category.name format
- No duplicate IDs
- Run: `node scripts/validate/validate.mjs`

## Outputs

- `docs/registry/features.yaml` — populated with features from GDD
- `docs/features/<id>/` — directories created for each new feature
- Git commit + push (after user confirmation)
- Google Drive upload (if configured)

## Failure Behavior

- No GDD sources found: report where to place GDD files and suggest /design-sync
- GDD has no sections: report that GDD content has no ## headings to extract
- Registry already complete: report no new features needed, show existing count
- Google Drive upload fails: report error, Git push still succeeds (Drive is optional)
