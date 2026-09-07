#!/usr/bin/env node

/**
 * Game AI Workflows CLI
 *
 * Usage:
 *   game-ai-workflows init [target-dir]  — Install into a project
 *   game-ai-workflows mcp                — Run as MCP server (for Claude Code / AI agents)
 *   game-ai-workflows bootstrap          — Run bootstrap
 *   game-ai-workflows validate           — Validate workflow
 *   game-ai-workflows list-features      — List features
 *   game-ai-workflows find-feature <q>   — Find feature
 *   game-ai-workflows feature-status <id> — Feature status
 */

import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  switch (command) {
    case 'init': {
      const { Installer } = await import('../scripts/install.mjs');
      const target = args[0] || process.cwd();
      const installer = new Installer(target, PACKAGE_ROOT);
      installer.install();
      break;
    }

    case 'mcp': {
      const { startMCPServer } = await import('../src/mcp-server.mjs');
      await startMCPServer();
      break;
    }

    case 'bootstrap': {
      const { Bootstrap } = await import('../scripts/bootstrap/bootstrap.mjs');
      const bs = new Bootstrap(process.cwd());
      const ok = await bs.run();
      process.exit(ok ? 0 : 1);
      break;
    }

    case 'validate': {
      const { WorkflowValidator } = await import('../scripts/validate/validate.mjs');
      const v = new WorkflowValidator(process.cwd());
      process.exit(v.validate() ? 0 : 1);
      break;
    }

    case 'list-features': {
      const { listFeatures } = await import('../scripts/registry/feature-lookup.mjs');
      const features = listFeatures({ projectRoot: process.cwd(), status: args[0] });
      if (features.length === 0) {
        console.log('No features found.');
      } else {
        for (const f of features) {
          console.log(`${(f.id || '').padEnd(30)} ${(f.status || '').padEnd(15)} ${f.name || ''}`);
        }
      }
      break;
    }

    case 'find-feature': {
      const { resolveFeature } = await import('../scripts/registry/feature-lookup.mjs');
      const query = args.join(' ');
      if (!query) { console.error('Usage: game-ai-workflows find-feature <query>'); process.exit(1); }
      const result = resolveFeature(query, { projectRoot: process.cwd() });
      if (result.exact) {
        console.log(`${result.exact.id} (${result.exact.name})`);
      } else if (result.candidates.length > 0) {
        console.log('Not found. Candidates:');
        result.candidates.forEach((c, i) => console.log(`  ${i + 1}. ${c.feature.id} — ${c.reason}`));
      } else {
        console.log('Not found.');
      }
      break;
    }

    case 'feature-status': {
      const { resolveFeature } = await import('../scripts/registry/feature-lookup.mjs');
      const query = args.join(' ');
      if (!query) { console.error('Usage: game-ai-workflows feature-status <id>'); process.exit(1); }
      const result = resolveFeature(query, { projectRoot: process.cwd() });
      if (result.exact) {
        const f = result.exact;
        console.log(`ID:       ${f.id}`);
        console.log(`Name:     ${f.name || ''}`);
        console.log(`Status:   ${f.status || ''}`);
        console.log(`Category: ${f.category || ''}`);
      } else {
        console.log(`Not found: ${query}`);
        if (result.candidates?.length) result.candidates.forEach((c, i) => console.log(`  ${i + 1}. ${c.feature.id}`));
      }
      break;
    }

    case 'help':
    case '--help':
    case '-h':
    case undefined:
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`game-ai-workflows — Portable Game Design → Feature → Development → QA workflow

Usage:
  game-ai-workflows init [dir]           Install into project directory
  game-ai-workflows mcp                  Run as MCP server (for Claude Code plugin)
  game-ai-workflows bootstrap            Initialize workflow environment
  game-ai-workflows validate             Validate registries
  game-ai-workflows list-features [st]   List features (optional status filter)
  game-ai-workflows find-feature <q>     Find feature by ID/name/fuzzy
  game-ai-workflows feature-status <id>  Show feature status
  game-ai-workflows help                 Show this help

MCP Plugin Setup (Claude Code):
  Add to .mcp.json in project root:
  {
    "mcpServers": {
      "game-ai-workflows": {
        "command": "npx",
        "args": ["-y", "game-ai-workflows@latest", "mcp"]
      }
    }
  }
`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
