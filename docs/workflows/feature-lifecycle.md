# Feature Lifecycle

## States

```
PLANNED → DESIGN_REVIEW → READY → IN_PROGRESS → IMPLEMENTED → TESTING → PLAYTEST → VERIFIED
```

### Happy Path
1. **PLANNED** — Feature identified, not yet reviewed
2. **DESIGN_REVIEW** — Design being reviewed for completeness
3. **READY** — Design approved, ready for implementation
4. **IN_PROGRESS** — Implementation underway
5. **IMPLEMENTED** — Code complete, ready for testing
6. **TESTING** — Automated tests being run
7. **PLAYTEST** — Manual/gameplay testing
8. **VERIFIED** — All checks passed, feature complete

### Special States
- **BLOCKED** — Cannot proceed (dependency, external blocker)
- **NEEDS_REVIEW** — Issues found, needs attention
- **DESIGN_CHANGED** — GDD changed after spec was written
- **DEPRECATED** — Feature retired
- **CANCELLED** — Feature abandoned

## Valid Transitions

| From | To |
|------|-----|
| PLANNED | DESIGN_REVIEW, CANCELLED |
| DESIGN_REVIEW | READY, PLANNED, BLOCKED, CANCELLED |
| READY | IN_PROGRESS, BLOCKED, DESIGN_CHANGED, CANCELLED |
| IN_PROGRESS | IMPLEMENTED, BLOCKED, NEEDS_REVIEW, DESIGN_CHANGED, CANCELLED |
| IMPLEMENTED | TESTING, BLOCKED, NEEDS_REVIEW, DESIGN_CHANGED |
| TESTING | PLAYTEST, NEEDS_REVIEW, IN_PROGRESS, BLOCKED |
| PLAYTEST | VERIFIED, NEEDS_REVIEW, TESTING, BLOCKED |
| VERIFIED | DEPRECATED |
| BLOCKED | PLANNED, DESIGN_REVIEW, READY, IN_PROGRESS, CANCELLED |
| NEEDS_REVIEW | DESIGN_REVIEW, IN_PROGRESS, CANCELLED |
| DESIGN_CHANGED | DESIGN_REVIEW, CANCELLED |
| DEPRECATED | _(terminal)_ |
| CANCELLED | _(terminal)_ |
