Generate features.yaml from GDD documents, commit, push, and upload to Google Drive.

Read `skills/generate-features/SKILL.md` for full procedure.

Steps:
1. Run: `node scripts/registry/generate-features.mjs`
2. Show user the list of created features
3. Run: `node scripts/validate/validate.mjs` to verify
4. Ask user to confirm before committing
5. If confirmed: `git add docs/registry/features.yaml docs/features/` then commit and push
6. Check Google Drive upload config in `.ai/config/gdd.yaml`
7. If upload.enabled is true and provider is google-drive:
   - Read features.yaml content
   - If features_file_id exists: call mcp__claude_ai_Google_Drive__update_file with fileId and textContent
   - If no file ID: call mcp__claude_ai_Google_Drive__create_file with title "features.yaml", textContent, and parentId from folder_id
   - Save returned file ID back to .ai/config/gdd.yaml for future updates
8. If no GDD sources found, suggest running /design-sync first

Never push without user confirmation. Google Drive upload is optional (only if configured).
