#!/usr/bin/env node

/**
 * System Lookup
 * Query systems registry. Supports bidirectional tracing:
 * System → Features, Feature → Systems
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseSimpleYaml } from '../validate/validate.mjs';

class SystemLookup {
  constructor(projectRoot = process.cwd()) {
    this.root = projectRoot;
  }

  /**
   * Load systems from registry
   */
  loadSystems() {
    const path = join(this.root, 'docs', 'registry', 'systems.yaml');
    if (!existsSync(path)) return [];
    return parseSimpleYaml(readFileSync(path, 'utf-8')).systems || [];
  }

  /**
   * Load features from registry
   */
  loadFeatures() {
    const path = join(this.root, 'docs', 'registry', 'features.yaml');
    if (!existsSync(path)) return [];
    return parseSimpleYaml(readFileSync(path, 'utf-8')).features || [];
  }

  /**
   * Find system by ID
   */
  findSystem(systemId) {
    return this.loadSystems().find(s => s.id === systemId) || null;
  }

  /**
   * Get all features that use a system (System → Features)
   */
  systemToFeatures(systemId) {
    const features = this.loadFeatures();
    return features.filter(f => {
      const systems = f.systems || [];
      return Array.isArray(systems) && systems.includes(systemId);
    });
  }

  /**
   * Get all systems used by a feature (Feature → Systems)
   */
  featureToSystems(featureId) {
    const features = this.loadFeatures();
    const feature = features.find(f => f.id === featureId);
    if (!feature) return [];

    const systemIds = feature.systems || [];
    if (!Array.isArray(systemIds)) return [];

    const systems = this.loadSystems();
    return systemIds.map(sId => systems.find(s => s.id === sId) || { id: sId, name: sId, missing: true });
  }

  /**
   * Trace full chain: System → Features → GDD
   */
  traceSystem(systemId) {
    const system = this.findSystem(systemId);
    const features = this.systemToFeatures(systemId);

    return {
      system: system || { id: systemId, missing: true },
      features: features.map(f => ({
        id: f.id,
        name: f.name,
        status: f.status,
        gdd: f.gdd || { document: f.document, section: f.section },
      })),
    };
  }

  /**
   * Full bidirectional trace for a feature
   */
  traceFeature(featureId) {
    const features = this.loadFeatures();
    const feature = features.find(f => f.id === featureId);
    if (!feature) return null;

    const systems = this.featureToSystems(featureId);
    const gdd = feature.gdd || { document: feature.document, section: feature.section };
    const spec = feature.spec;
    const code = feature.code?.paths || [];
    const tests = feature.tests?.paths || [];
    const deps = feature.dependencies || [];
    const designChanges = feature.design_changes || [];

    // Find related features through shared systems
    const relatedFeatures = new Set();
    for (const sys of systems) {
      if (sys.missing) continue;
      const relFeatures = this.systemToFeatures(sys.id);
      relFeatures.forEach(f => { if (f.id !== featureId) relatedFeatures.add(f.id); });
    }

    return {
      feature: { id: feature.id, name: feature.name, status: feature.status },
      gdd,
      spec,
      systems: systems.map(s => ({ id: s.id, name: s.name, missing: !!s.missing })),
      code,
      tests,
      dependencies: deps,
      designChanges,
      relatedFeatures: [...relatedFeatures],
    };
  }

  /**
   * List all systems
   */
  listSystems() {
    return this.loadSystems();
  }
}

// CLI entry point
if (process.argv[1]?.endsWith('system-lookup.mjs')) {
  const lookup = new SystemLookup();
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'list': {
      const systems = lookup.listSystems();
      if (systems.length === 0) { console.log('No systems registered.'); break; }
      console.log('Systems:\n');
      for (const s of systems) {
        console.log(`  ${s.id.padEnd(30)} ${s.name || ''}`);
      }
      break;
    }
    case 'trace-system': {
      if (!arg) { console.error('Usage: system-lookup.mjs trace-system <system-id>'); process.exit(1); }
      const trace = lookup.traceSystem(arg);
      console.log(`System: ${trace.system.id} ${trace.system.missing ? '(not in registry)' : ''}`);
      console.log(`\nFeatures using this system:`);
      if (trace.features.length === 0) console.log('  (none)');
      for (const f of trace.features) {
        console.log(`  ${f.id.padEnd(30)} ${f.status || ''} → GDD: ${f.gdd?.document || '—'}/${f.gdd?.section || '—'}`);
      }
      break;
    }
    case 'trace-feature': {
      if (!arg) { console.error('Usage: system-lookup.mjs trace-feature <feature-id>'); process.exit(1); }
      const trace = lookup.traceFeature(arg);
      if (!trace) { console.log(`Feature not found: ${arg}`); break; }
      console.log(`Feature:    ${trace.feature.id} (${trace.feature.name})`);
      console.log(`Status:     ${trace.feature.status}`);
      console.log(`GDD:        ${trace.gdd?.document || '—'} / ${trace.gdd?.section || '—'}`);
      console.log(`Spec:       ${trace.spec || '—'}`);
      console.log(`Systems:    ${trace.systems.map(s => s.id + (s.missing ? ' ✗' : '')).join(', ') || '—'}`);
      console.log(`Code:       ${trace.code.join(', ') || '—'}`);
      console.log(`Tests:      ${trace.tests.join(', ') || '—'}`);
      console.log(`Deps:       ${trace.dependencies.join(', ') || '—'}`);
      console.log(`Changes:    ${trace.designChanges.join(', ') || '—'}`);
      console.log(`Related:    ${trace.relatedFeatures.join(', ') || '—'}`);
      break;
    }
    default:
      console.log(`system-lookup.mjs <command> [args]

Commands:
  list                        List all systems
  trace-system <system-id>    System → Features → GDD
  trace-feature <feature-id>  Feature → Systems/GDD/Code/Tests
`);
  }
}

export { SystemLookup };
