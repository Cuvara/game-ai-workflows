Generate features.yaml from GDD documents, commit and push.

Read `skills/generate-features/SKILL.md` for full procedure.

Steps:
1. Run: `node scripts/registry/generate-features.mjs`
2. Show user the list of created features
3. Run: `node scripts/validate/validate.mjs` to verify
4. Ask user to confirm before committing
5. If confirmed: `git add docs/registry/features.yaml docs/features/` then commit and push
6. If no GDD sources found, suggest running /design-sync first or placing GDD files in docs/gdd/

Never push without user confirmation.
