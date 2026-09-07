#!/usr/bin/env node

/**
 * Game AI Workflows MCP Server
 *
 * Minimal MCP (Model Context Protocol) server over stdio.
 * Implements JSON-RPC 2.0 over stdin/stdout.
 * Zero external dependencies.
 *
 * Exposes workflow tools to Claude Code, Codex, and other MCP-compatible agents.
 */

import { createInterface } from 'readline';
import { resolve } from 'path';

const PROJECT_ROOT = process.env.GAME_AI_WORKFLOWS_ROOT || process.cwd();

// Tool definitions
const TOOLS = [
  {
    name: 'workflow_bootstrap',
    description: 'Initialize the game AI workflow environment. Detects OS, runtimes, providers, creates registries and state files. Idempotent — safe to run multiple times.',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: { type: 'string', description: 'Project root path (defaults to cwd)' }
      }
    }
  },
  {
    name: 'workflow_validate',
    description: 'Validate workflow registries. Checks for duplicate IDs, broken references, missing specs, invalid states, invalid transitions.',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: { type: 'string', description: 'Project root path (defaults to cwd)' }
      }
    }
  },
  {
    name: 'workflow_list_features',
    description: 'List all features from the feature registry, optionally filtered by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: PLANNED, IN_PROGRESS, READY, IMPLEMENTED, TESTING, PLAYTEST, VERIFIED, BLOCKED, etc.' },
        projectRoot: { type: 'string', description: 'Project root path' }
      }
    }
  },
  {
    name: 'workflow_find_feature',
    description: 'Find a feature by ID, name, alias, or fuzzy match. Handles typos. Never guesses — returns candidates for ambiguous matches.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Feature ID, name, or search term' },
        projectRoot: { type: 'string', description: 'Project root path' }
      },
      required: ['query']
    }
  },
  {
    name: 'workflow_feature_status',
    description: 'Show comprehensive status of a feature including GDD sync, spec, design changes, implementation progress, tests.',
    inputSchema: {
      type: 'object',
      properties: {
        featureId: { type: 'string', description: 'Feature ID or search query' },
        projectRoot: { type: 'string', description: 'Project root path' }
      },
      required: ['featureId']
    }
  },
  {
    name: 'workflow_feature_impact',
    description: 'Trace all relationships for a feature: GDD → Feature → Spec → Systems → Code → Tests → Design Changes.',
    inputSchema: {
      type: 'object',
      properties: {
        featureId: { type: 'string', description: 'Feature ID' },
        projectRoot: { type: 'string', description: 'Project root path' }
      },
      required: ['featureId']
    }
  },
  {
    name: 'workflow_preflight',
    description: 'Run design preflight check before implementation. Blocks if GDD is stale, design changes pending, spec missing, or dependencies unmet.',
    inputSchema: {
      type: 'object',
      properties: {
        featureId: { type: 'string', description: 'Feature ID to check' },
        projectRoot: { type: 'string', description: 'Project root path' }
      },
      required: ['featureId']
    }
  },
  {
    name: 'workflow_design_changes',
    description: 'List pending design changes, optionally filtered by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: PENDING, APPROVED, REJECTED, DEFERRED, IMPLEMENTED' },
        projectRoot: { type: 'string', description: 'Project root path' }
      }
    }
  },
  {
    name: 'workflow_system_trace',
    description: 'Bidirectional system tracing. Trace System → Features or Feature → Systems.',
    inputSchema: {
      type: 'object',
      properties: {
        systemId: { type: 'string', description: 'System ID to trace (use this OR featureId)' },
        featureId: { type: 'string', description: 'Feature ID to trace (use this OR systemId)' },
        projectRoot: { type: 'string', description: 'Project root path' }
      }
    }
  },
  {
    name: 'workflow_discover_unmapped',
    description: 'Find GDD sections that have no matching feature in the registry. Suggests feature IDs for new sections.',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: { type: 'string', description: 'Project root path' }
      }
    }
  }
];

// Tool handlers
async function handleToolCall(name, args) {
  const root = args?.projectRoot || PROJECT_ROOT;

  // Dynamic imports to keep startup fast
  switch (name) {
    case 'workflow_bootstrap': {
      const { Bootstrap } = await import('../scripts/bootstrap/bootstrap.mjs');
      const bs = new Bootstrap(root);
      // Capture console output
      const logs = [];
      const origLog = console.log;
      console.log = (...a) => logs.push(a.join(' '));
      const ok = await bs.run();
      console.log = origLog;
      return { success: ok, output: logs.join('\n') };
    }

    case 'workflow_validate': {
      const { WorkflowValidator } = await import('../scripts/validate/validate.mjs');
      const v = new WorkflowValidator(root);
      const logs = [];
      const origLog = console.log;
      console.log = (...a) => logs.push(a.join(' '));
      const ok = v.validate();
      console.log = origLog;
      return { valid: ok, issues: v.issues, warnings: v.warnings, output: logs.join('\n') };
    }

    case 'workflow_list_features': {
      const { listFeatures } = await import('../scripts/registry/feature-lookup.mjs');
      const features = listFeatures({ projectRoot: root, status: args?.status });
      return { features: features.map(f => ({ id: f.id, name: f.name, status: f.status, category: f.category })) };
    }

    case 'workflow_find_feature': {
      const { resolveFeature } = await import('../scripts/registry/feature-lookup.mjs');
      const result = resolveFeature(args.query, { projectRoot: root });
      if (result.exact) {
        return { found: true, feature: { id: result.exact.id, name: result.exact.name, status: result.exact.status } };
      }
      return { found: false, candidates: result.candidates.map(c => ({ id: c.feature.id, name: c.feature.name, reason: c.reason })) };
    }

    case 'workflow_feature_status': {
      const { resolveFeature } = await import('../scripts/registry/feature-lookup.mjs');
      const result = resolveFeature(args.featureId, { projectRoot: root });
      if (!result.exact) {
        return { found: false, candidates: result.candidates.map(c => ({ id: c.feature.id, reason: c.reason })) };
      }
      const f = result.exact;
      const { existsSync } = await import('fs');
      const { join } = await import('path');
      const specPath = f.spec?.path || f.spec || `docs/features/${f.id}/spec.md`;
      return {
        found: true,
        id: f.id,
        name: f.name,
        status: f.status,
        category: f.category,
        gdd: f.gdd || null,
        specExists: existsSync(join(root, specPath)),
        systems: f.systems || [],
        dependencies: f.dependencies || [],
        designChanges: f.design_changes || []
      };
    }

    case 'workflow_feature_impact': {
      const { SystemLookup } = await import('../scripts/registry/system-lookup.mjs');
      const lookup = new SystemLookup(root);
      const trace = lookup.traceFeature(args.featureId);
      if (!trace) return { found: false };
      return { found: true, ...trace };
    }

    case 'workflow_preflight': {
      const { Preflight } = await import('../scripts/preflight/preflight.mjs');
      const pf = new Preflight(root);
      return pf.check(args.featureId);
    }

    case 'workflow_design_changes': {
      const { DesignChangeManager } = await import('../scripts/registry/design-change.mjs');
      const mgr = new DesignChangeManager(root);
      const changes = mgr.list(args?.status);
      return { changes };
    }

    case 'workflow_system_trace': {
      const { SystemLookup } = await import('../scripts/registry/system-lookup.mjs');
      const lookup = new SystemLookup(root);
      if (args?.systemId) {
        return lookup.traceSystem(args.systemId);
      } else if (args?.featureId) {
        const trace = lookup.traceFeature(args.featureId);
        return trace || { found: false };
      }
      return { error: 'Provide systemId or featureId' };
    }

    case 'workflow_discover_unmapped': {
      const { Discovery } = await import('../scripts/discovery/gdd-discovery.mjs');
      const disc = new Discovery(root);
      return { unmapped: disc.findUnmappedSections() };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Minimal MCP JSON-RPC 2.0 stdio server with Content-Length framing.
 * MCP uses HTTP-style header framing: "Content-Length: N\r\n\r\n{json}"
 */

function sendResponse(response) {
  const body = JSON.stringify(response);
  const header = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`;
  process.stdout.write(header + body);
}

export async function startMCPServer() {
  let buffer = Buffer.alloc(0);
  let contentLength = -1;

  // Prevent crashes from killing the server
  process.on('uncaughtException', (err) => {
    process.stderr.write(`MCP uncaught: ${err.message}\n`);
  });
  process.on('unhandledRejection', (err) => {
    process.stderr.write(`MCP unhandled: ${err?.message || err}\n`);
  });

  process.stderr.write('Game AI Workflows MCP server started\n');

  let processing = false;
  const pending = [];

  async function processBuffer() {
    if (processing) return;
    processing = true;
    try {
      while (true) {
        if (contentLength === -1) {
          const headerEnd = buffer.indexOf('\r\n\r\n');
          if (headerEnd === -1) break;

          const header = buffer.subarray(0, headerEnd).toString();
          const match = header.match(/Content-Length:\s*(\d+)/i);
          if (!match) {
            buffer = buffer.subarray(headerEnd + 4);
            continue;
          }
          contentLength = parseInt(match[1], 10);
          buffer = buffer.subarray(headerEnd + 4);
        }

        if (buffer.length < contentLength) break;

        const body = buffer.subarray(0, contentLength).toString();
        buffer = buffer.subarray(contentLength);
        contentLength = -1;

        try {
          const msg = JSON.parse(body);
          const response = await handleMessage(msg);
          if (response) {
            sendResponse(response);
          }
        } catch (err) {
          sendResponse({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error', data: err.message }
          });
        }
      }
    } finally {
      processing = false;
    }
  }

  process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    processBuffer().catch(err => {
      process.stderr.write(`MCP process error: ${err.message}\n`);
    });
  });

  process.stdin.on('close', () => process.exit(0));
}

async function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'game-ai-workflows',
            version: '1.0.0'
          }
        }
      };

    case 'notifications/initialized':
      return null; // No response for notifications

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS }
      };

    case 'tools/call': {
      const { name, arguments: toolArgs } = params;
      try {
        const result = await handleToolCall(name, toolArgs || {});
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Error: ${err.message}` }],
            isError: true
          }
        };
      }
    }

    default:
      // Unknown method — return method not found
      if (id !== undefined) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
      }
      return null; // Ignore unknown notifications
  }
}

// Auto-start if run directly
if (process.argv[1]?.endsWith('mcp-server.mjs')) {
  startMCPServer();
}
