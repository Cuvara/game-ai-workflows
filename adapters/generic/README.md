# Generic Adapter

Provides a generic CLI and programmatic interface for any AI coding agent
to invoke the portable game design workflow.

## CLI Usage

```bash
node adapters/generic/agent-workflow.mjs <command> [args]
```

## Programmatic Usage

```javascript
import { AgentWorkflow } from './adapters/generic/agent-workflow.mjs';

const workflow = new AgentWorkflow();
await workflow.bootstrap();
const features = workflow.listFeatures();
const result = workflow.findFeature('inventory');
```

## Extending

To create a new adapter for a specific agent:

1. Create `adapters/<agent-name>/`
2. Import from portable core scripts
3. Map agent-specific capabilities to workflow operations
4. See `adapters/codex/` for a reference implementation
