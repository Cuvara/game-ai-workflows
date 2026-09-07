#!/usr/bin/env node

/**
 * Generic Agent Workflow CLI
 *
 * Agent-agnostic CLI for workflow operations.
 * Any AI coding agent can use this directly.
 */

import { Bootstrap } from '../../scripts/bootstrap/bootstrap.mjs';
import { WorkflowValidator } from '../../scripts/validate/validate.mjs';
import { resolveFeature, listFeatures, loadFeatures } from '../../scripts/registry/feature-lookup.mjs';
import { createProvider } from '../../providers/provider-factory.mjs';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export class AgentWorkflow {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async bootstrap() {
    const bs = new Bootstrap();
    return bs.run();
  }

  validate() {
    const v = new WorkflowValidator(this.projectRoot);
    return v.validate();
  }

  listFeatures(status) {
    return listFeatures({ projectRoot: this.projectRoot, status });
  }

  findFeature(query) {
    return resolveFeature(query, { projectRoot: this.projectRoot });
  }

  featureStatus(featureId) {
    const result = this.findFeature(featureId);
    if (!result.exact) return { found: false, candidates: result.candidates };

    const f = result.exact;
    const specPath = f.spec?.path || f.spec;
    return {
      found: true,
      id: f.id,
      name: f.name,
      category: f.category,
      status: f.status,
      gdd: f.gdd,
      specExists: specPath ? existsSync(join(this.projectRoot, specPath)) : false,
      systems: f.systems || [],
      dependencies: f.dependencies || [],
      designChanges: f.design_changes || [],
    };
  }

  featureImpact(featureId) {
    const result = this.findFeature(featureId);
    if (!result.exact) return { found: false, candidates: result.candidates };

    const f = result.exact;
    return {
      found: true,
      id: f.id,
      gdd: f.gdd || null,
      spec: f.spec || null,
      systems: f.systems || [],
      code: f.code?.paths || [],
      tests: f.tests?.paths || [],
      dependencies: f.dependencies || [],
      designChanges: f.design_changes || [],
    };
  }

  getProvider(type, config) {
    return createProvider(type || 'local', config);
  }
}

// CLI entry point
if (process.argv[1] && (process.argv[1].endsWith('agent-workflow.mjs') || process.argv[1].endsWith('agent-workflow'))) {
  const workflow = new AgentWorkflow();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  async function run() {
    switch (command) {
      case 'bootstrap':
        await workflow.bootstrap();
        break;

      case 'validate':
        process.exit(workflow.validate() ? 0 : 1);
        break;

      case 'list-features': {
        const features = workflow.listFeatures(args[0]);
        if (features.length === 0) {
          console.log('No features found.');
        } else {
          for (const f of features) {
            console.log(`${f.id.padEnd(30)} ${(f.status || '').padEnd(15)} ${f.name || ''}`);
          }
        }
        break;
      }

      case 'find-feature': {
        const q = args.join(' ');
        if (!q) { console.error('Usage: agent-workflow find-feature <query>'); process.exit(1); }
        const r = workflow.findFeature(q);
        if (r.exact) {
          console.log(`${r.exact.id} (${r.exact.name})`);
        } else if (r.candidates.length > 0) {
          console.log('Not found. Candidates:');
          r.candidates.forEach((c, i) => console.log(`  ${i+1}. ${c.feature.id} — ${c.reason}`));
        } else {
          console.log('Not found.');
        }
        break;
      }

      case 'feature-status': {
        const q = args.join(' ');
        if (!q) { console.error('Usage: agent-workflow feature-status <id>'); process.exit(1); }
        const s = workflow.featureStatus(q);
        if (!s.found) {
          console.log(`Not found: ${q}`);
          if (s.candidates?.length) s.candidates.forEach((c,i) => console.log(`  ${i+1}. ${c.feature.id}`));
        } else {
          console.log(`ID:       ${s.id}`);
          console.log(`Name:     ${s.name}`);
          console.log(`Status:   ${s.status}`);
          console.log(`Spec:     ${s.specExists ? '✓' : '✗'}`);
          console.log(`Systems:  ${s.systems.length}`);
        }
        break;
      }

      case 'feature-impact': {
        const q = args.join(' ');
        if (!q) { console.error('Usage: agent-workflow feature-impact <id>'); process.exit(1); }
        const imp = workflow.featureImpact(q);
        if (!imp.found) {
          console.log(`Not found: ${q}`);
        } else {
          console.log(`Feature:        ${imp.id}`);
          console.log(`GDD:            ${imp.gdd ? `${imp.gdd.document}/${imp.gdd.section}` : '—'}`);
          console.log(`Spec:           ${imp.spec || '—'}`);
          console.log(`Systems:        ${imp.systems.join(', ') || '—'}`);
          console.log(`Code paths:     ${imp.code.join(', ') || '—'}`);
          console.log(`Test paths:     ${imp.tests.join(', ') || '—'}`);
          console.log(`Dependencies:   ${imp.dependencies.join(', ') || '—'}`);
          console.log(`Design changes: ${imp.designChanges.join(', ') || '—'}`);
        }
        break;
      }

      default:
        console.log(`agent-workflow <command> [args]

Commands:
  bootstrap              Initialize environment
  validate               Validate workflow
  list-features [status] List features
  find-feature <query>   Find feature
  feature-status <id>    Show status
  feature-impact <id>    Show impact
`);
    }
  }

  run().catch(err => { console.error(err.message); process.exit(1); });
}
