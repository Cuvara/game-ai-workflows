# AI Workflow Rules

## Authoritative Sources

1. **Feature Registry** (`docs/registry/features.yaml`) is the authoritative feature index
2. **GDD** (via configured provider) is the design source of truth
3. **Feature Spec** (`docs/features/<id>/spec.md`) is the engineering source of truth
4. **Git** is engineering history

## Mandatory Rules

### Feature Identity
- Stable IDs are mandatory (`category.feature-name` format)
- Never guess feature IDs — resolve through registry
- Display names may change; IDs must not (unless concept changes)
- Ambiguous lookups must ask the user, never silently pick

### Design Integrity
- GDD is the single source of design truth
- Design changes must be traceable (GDD revision → design change record → affected features)
- Stale design must not be silently implemented
- Implementation requires current GDD sync

### Verification
- Verification requires evidence (tests passing, playtest completed)
- Never mark VERIFIED without all checks passing
- Never claim automated validation happened when it did not
- Missing tests must be reported, not ignored

### Bootstrap
- Bootstrap must run before workflows when dependencies are missing
- Bootstrap is idempotent — safe to run repeatedly
- Detect automatically; ask only when human input is genuinely required
- Never ask for information that can be detected

### Security
- Never commit credentials
- Never print secrets in logs
- Never store tokens in files committed to Git
- Use provider-native authentication flows
- Use `.gitignore` for local secret/config files

### Provider Abstraction
- Workflow logic depends on provider interface, not specific providers
- Google Drive is one provider; workflow must support alternatives
- Offline operations must work when provider is unavailable and local state exists
