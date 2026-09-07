Implement feature following its plan

Read skills/implement-feature/SKILL.md. If no args: node adapters/generic/agent-workflow.mjs list-features READY and show. If args: resolve feature, run preflight: node scripts/preflight/preflight.mjs <id>. If fails STOP. Read plan from docs/features/<id>/implementation-plan.md. Follow plan. Write tests. Update status. CRITICAL: never implement with stale design.
