#!/usr/bin/env node

/**
 * Design Preflight
 * Checks that design is current before implementation begins.
 * Blocks if: GDD stale, pending design changes, missing spec, missing plan.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseSimpleYaml } from '../validate/validate.mjs';

class Preflight {
  constructor(projectRoot = process.cwd()) {
    this.root = projectRoot;
  }

  /**
   * Run preflight checks for a feature
   * @param {string} featureId
   * @returns {{passed: boolean, checks: Object, blockers: string[]}}
   */
  check(featureId) {
    const blockers = [];
    const checks = {};

    // 1. Feature exists in registry
    const feature = this.findFeature(featureId);
    checks.featureExists = !!feature;
    if (!feature) {
      blockers.push(`Feature "${featureId}" not found in registry`);
      return { passed: false, checks, blockers };
    }

    // 2. GDD sync check
    const gddFresh = this.checkGDDFreshness(feature);
    checks.gddSynced = gddFresh.fresh;
    if (!gddFresh.fresh) {
      blockers.push(`GDD stale: ${gddFresh.reason}`);
    }

    // 3. Pending design changes
    const pendingChanges = this.checkPendingDesignChanges(featureId);
    checks.noDesignChanges = pendingChanges.length === 0;
    if (pendingChanges.length > 0) {
      blockers.push(`${pendingChanges.length} pending design change(s) affect this feature: ${pendingChanges.join(', ')}`);
    }

    // 4. Feature spec exists
    const specPath = this.getSpecPath(feature);
    checks.specExists = existsSync(join(this.root, specPath));
    if (!checks.specExists) {
      blockers.push(`Feature spec missing: ${specPath}`);
    }

    // 5. Feature status allows implementation
    const status = feature.status || 'PLANNED';
    const implementableStatuses = ['READY', 'IN_PROGRESS', 'NEEDS_REVIEW'];
    checks.statusValid = implementableStatuses.includes(status);
    if (!checks.statusValid) {
      blockers.push(`Feature status "${status}" does not allow implementation. Must be: ${implementableStatuses.join(', ')}`);
    }

    // 6. Dependencies check
    const depCheck = this.checkDependencies(feature);
    checks.dependenciesMet = depCheck.met;
    if (!depCheck.met) {
      blockers.push(`Unmet dependencies: ${depCheck.unmet.join(', ')}`);
    }

    return {
      passed: blockers.length === 0,
      checks,
      blockers,
    };
  }

  /**
   * Print preflight report
   */
  report(featureId) {
    const result = this.check(featureId);

    console.log(`DESIGN PREFLIGHT — ${featureId}\n`);

    for (const [name, ok] of Object.entries(result.checks)) {
      const label = name.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      console.log(`  ${ok ? '✓' : '✗'} ${label}`);
    }

    if (result.passed) {
      console.log('\nPreflight passed. ✓ Implementation may proceed.');
    } else {
      console.log('\nIMPLEMENTATION BLOCKED\n');
      for (const b of result.blockers) {
        console.log(`  ✗ ${b}`);
      }
    }

    return result;
  }

  // --- Helpers ---

  findFeature(featureId) {
    const path = join(this.root, 'docs', 'registry', 'features.yaml');
    if (!existsSync(path)) return null;
    const data = parseSimpleYaml(readFileSync(path, 'utf-8'));
    return (data.features || []).find(f => f.id === featureId);
  }

  checkGDDFreshness(feature) {
    const stateFile = join(this.root, '.ai', 'gdd-state.json');
    if (!existsSync(stateFile)) return { fresh: false, reason: 'GDD state not initialized. Run design-sync first.' };

    const state = JSON.parse(readFileSync(stateFile, 'utf-8'));
    const docId = feature.document || feature.gdd?.document;
    if (!docId) return { fresh: true, reason: 'No GDD mapping' }; // No GDD link = skip check

    const docState = state.documents[docId];
    if (!docState) return { fresh: false, reason: `Document "${docId}" never synced` };

    // Check staleness (warn if >24h since last sync)
    const lastSync = new Date(docState.lastSyncedAt);
    const hoursSince = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) {
      return { fresh: false, reason: `Last sync ${Math.floor(hoursSince)} hours ago. Run design-sync.` };
    }

    return { fresh: true };
  }

  checkPendingDesignChanges(featureId) {
    const changesDir = join(this.root, 'docs', 'design-changes');
    if (!existsSync(changesDir)) return [];

    const pending = [];
    const files = readdirSync(changesDir).filter(f => f.startsWith('DC-') && f.endsWith('.md'));

    for (const file of files) {
      const content = readFileSync(join(changesDir, file), 'utf-8');
      if (content.includes('**Status:** PENDING') && content.includes(featureId)) {
        const idMatch = content.match(/\*\*ID:\*\*\s*(\S+)/);
        if (idMatch) pending.push(idMatch[1]);
      }
    }
    return pending;
  }

  getSpecPath(feature) {
    if (feature.spec) {
      return typeof feature.spec === 'string' ? feature.spec : feature.spec.path || `docs/features/${feature.id}/spec.md`;
    }
    return `docs/features/${feature.id}/spec.md`;
  }

  checkDependencies(feature) {
    const deps = feature.dependencies || [];
    if (!Array.isArray(deps) || deps.length === 0) return { met: true, unmet: [] };

    const path = join(this.root, 'docs', 'registry', 'features.yaml');
    if (!existsSync(path)) return { met: false, unmet: deps };

    const data = parseSimpleYaml(readFileSync(path, 'utf-8'));
    const features = data.features || [];
    const featureMap = new Map(features.map(f => [f.id, f]));

    const completedStatuses = ['IMPLEMENTED', 'TESTING', 'PLAYTEST', 'VERIFIED'];
    const unmet = deps.filter(depId => {
      const dep = featureMap.get(depId);
      return !dep || !completedStatuses.includes(dep.status);
    });

    return { met: unmet.length === 0, unmet };
  }
}

// CLI entry point
if (process.argv[1]?.endsWith('preflight.mjs')) {
  const featureId = process.argv[2];
  if (!featureId) {
    console.error('Usage: preflight.mjs <feature-id>');
    process.exit(1);
  }
  const pf = new Preflight();
  const result = pf.report(featureId);
  process.exit(result.passed ? 0 : 1);
}

export { Preflight };
