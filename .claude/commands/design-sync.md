Synchronize GDD from provider, create snapshots, detect design changes.

Read `skills/design-sync/SKILL.md` for the full procedure.

1. Run preflight: `node scripts/bootstrap/bootstrap.mjs`
2. Execute sync: `node scripts/sync/design-sync.mjs`
3. If design changes detected, show impact summary
4. If provider unavailable, report offline state and offer to use cached data

Never silently use stale design data.
