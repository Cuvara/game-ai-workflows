#!/usr/bin/env node

/**
 * Codex CLI Wrapper
 * Command-line interface for Codex agents to invoke workflow operations.
 */

import { CodexWorkflow } from './codex-adapter.mjs';

const workflow = new CodexWorkflow();

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  switch (command) {
    case 'bootstrap':
      await workflow.bootstrap();
      break;

    case 'validate':
      const valid = workflow.validate();
      process.exit(valid ? 0 : 1);
      break;

    case 'list-features': {
      const status = args[0];
      const features = workflow.listFeatures(status);
      if (features.length === 0) {
        console.log('No features found.');
      } else {
        console.log('Features:');
        for (const f of features) {
          console.log(`  ${f.id.padEnd(30)} ${(f.status || '').padEnd(15)} ${f.name || ''}`);
        }
      }
      break;
    }

    case 'find-feature': {
      const query = args.join(' ');
      if (!query) {
        console.error('Usage: codex-cli.mjs find-feature <query>');
        process.exit(1);
      }
      const result = workflow.findFeature(query);
      if (result.exact) {
        console.log(`Resolved: ${result.exact.id} (${result.exact.name})`);
      } else if (result.candidates.length > 0) {
        console.log('Feature not found.\n\nPossible matches:');
        result.candidates.forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.feature.id} — ${c.reason}`);
        });
      } else {
        console.log('Feature not found. No similar features in registry.');
      }
      break;
    }

    case 'feature-status': {
      const featureQuery = args.join(' ');
      if (!featureQuery) {
        console.error('Usage: codex-cli.mjs feature-status <feature-id>');
        process.exit(1);
      }
      const result = workflow.findFeature(featureQuery);
      if (result.exact) {
        const f = result.exact;
        console.log('FEATURE STATUS\n');
        console.log(`ID:          ${f.id}`);
        console.log(`Name:        ${f.name || 'unnamed'}`);
        console.log(`Category:    ${f.category || 'uncategorized'}`);
        console.log(`Status:      ${f.status || 'unknown'}`);
        if (f.gdd) console.log(`GDD:         ${f.gdd.document || ''} / ${f.gdd.section || ''}`);
      } else {
        console.log(`Feature "${featureQuery}" not found.`);
        if (result.candidates.length > 0) {
          console.log('\nDid you mean:');
          result.candidates.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.feature.id}`);
          });
        }
      }
      break;
    }

    default:
      console.log(`Game AI Workflow - Codex CLI

Usage: codex-cli.mjs <command> [args]

Commands:
  bootstrap                Initialize workflow environment
  validate                 Validate workflow state
  list-features [status]   List features (optional status filter)
  find-feature <query>     Find feature by ID/name/fuzzy match
  feature-status <id>      Show feature status
`);
      break;
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
