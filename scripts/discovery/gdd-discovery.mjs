#!/usr/bin/env node

/**
 * GDD & Feature Discovery
 * - Detects new GDD sections that have no matching features (§54)
 * - Finds potential new systems during feature planning (§55)
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseSimpleYaml } from '../validate/validate.mjs';

class Discovery {
  constructor(projectRoot = process.cwd()) {
    this.root = projectRoot;
  }

  /**
   * Find GDD sections that have no matching feature in the registry
   * @returns {Array<{sectionId: string, sectionName: string, document: string, suggestedFeatureId: string}>}
   */
  findUnmappedSections() {
    const gddRegistry = this.loadGDDRegistry();
    const features = this.loadFeatures();

    // Build set of mapped sections
    const mappedSections = new Set();
    for (const f of features) {
      const sec = f.section || f.gdd?.section;
      if (sec) mappedSections.add(sec);
    }

    // Also check snapshots for sections not in GDD registry
    const snapshotSections = this.extractSnapshotSections();

    const unmapped = [];

    // Check GDD registry sections
    for (const doc of (gddRegistry.documents || [])) {
      for (const section of (doc.sections || [])) {
        if (!mappedSections.has(section.id)) {
          unmapped.push({
            sectionId: section.id,
            sectionName: section.name || section.id,
            document: doc.id,
            suggestedFeatureId: this.suggestFeatureId(section.id, section.name),
          });
        }
      }
    }

    // Check snapshot sections not in registry
    for (const [docId, sections] of Object.entries(snapshotSections)) {
      for (const sectionId of sections) {
        if (!mappedSections.has(sectionId)) {
          // Check if already found from registry
          if (!unmapped.find(u => u.sectionId === sectionId && u.document === docId)) {
            unmapped.push({
              sectionId,
              sectionName: sectionId,
              document: docId,
              suggestedFeatureId: this.suggestFeatureId(sectionId),
            });
          }
        }
      }
    }

    return unmapped;
  }

  /**
   * Find potential systems for a feature based on its spec and existing systems
   * @param {string} featureId
   * @returns {{existing: Array, potential: Array}}
   */
  discoverSystems(featureId) {
    const features = this.loadFeatures();
    const systems = this.loadSystems();
    const feature = features.find(f => f.id === featureId);

    if (!feature) return { existing: [], potential: [] };

    const featureSystems = feature.systems || [];
    const existingSystemIds = new Set(systems.map(s => s.id));

    const existing = [];
    const potential = [];

    for (const sId of featureSystems) {
      if (existingSystemIds.has(sId)) {
        existing.push({ id: sId, status: 'EXISTING' });
      } else {
        potential.push({ id: sId, status: 'NEW', reason: 'Referenced in feature but not in system registry' });
      }
    }

    // Suggest systems based on feature ID and category
    const featureName = feature.name || feature.id.split('.').pop();
    const suggestedSystemId = `system.${feature.id.split('.').pop()}`;

    if (!featureSystems.includes(suggestedSystemId) && !existingSystemIds.has(suggestedSystemId)) {
      potential.push({ id: suggestedSystemId, status: 'POTENTIAL', reason: `Inferred from feature name "${featureName}"` });
    }

    // Check for UI system
    const uiSystemId = `system.${feature.id.split('.').pop()}-ui`;
    if (!featureSystems.includes(uiSystemId) && !existingSystemIds.has(uiSystemId)) {
      potential.push({ id: uiSystemId, status: 'POTENTIAL', reason: `UI system for "${featureName}"` });
    }

    return { existing, potential };
  }

  /**
   * Generate a suggested feature ID from a GDD section
   */
  suggestFeatureId(sectionId, sectionName) {
    const base = (sectionName || sectionId).toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Try to determine category
    if (sectionId.startsWith('gameplay') || sectionId.startsWith('game')) return `gameplay.${base}`;
    if (sectionId.startsWith('ui') || sectionId.startsWith('interface')) return `ui.${base}`;
    if (sectionId.startsWith('system') || sectionId.startsWith('tech')) return `system.${base}`;
    return `gameplay.${base}`;
  }

  // --- Helpers ---

  loadGDDRegistry() {
    const path = join(this.root, 'docs', 'registry', 'gdd.yaml');
    if (!existsSync(path)) return { documents: [] };
    return parseSimpleYaml(readFileSync(path, 'utf-8'));
  }

  loadFeatures() {
    const path = join(this.root, 'docs', 'registry', 'features.yaml');
    if (!existsSync(path)) return [];
    return parseSimpleYaml(readFileSync(path, 'utf-8')).features || [];
  }

  loadSystems() {
    const path = join(this.root, 'docs', 'registry', 'systems.yaml');
    if (!existsSync(path)) return [];
    return parseSimpleYaml(readFileSync(path, 'utf-8')).systems || [];
  }

  extractSnapshotSections() {
    const snapshotsDir = join(this.root, 'docs', 'gdd', 'snapshots');
    if (!existsSync(snapshotsDir)) return {};

    const result = {};
    const files = readdirSync(snapshotsDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const docId = file.replace(/-rev-.*$/, '');
      const content = readFileSync(join(snapshotsDir, file), 'utf-8');
      const sections = [];

      for (const line of content.split('\n')) {
        const match = line.match(/^##\s+(.+)/);
        if (match) {
          sections.push(match[1].toLowerCase().replace(/[^a-z0-9\s.-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'));
        }
      }

      if (!result[docId]) result[docId] = [];
      for (const s of sections) {
        if (!result[docId].includes(s)) result[docId].push(s);
      }
    }

    return result;
  }
}

// CLI entry point
if (process.argv[1]?.endsWith('gdd-discovery.mjs')) {
  const disc = new Discovery();
  const command = process.argv[2];

  switch (command) {
    case 'unmapped': {
      const unmapped = disc.findUnmappedSections();
      if (unmapped.length === 0) {
        console.log('All GDD sections have matching features. ✓');
      } else {
        console.log('Unmapped GDD sections (no matching feature):\n');
        for (const u of unmapped) {
          console.log(`  ${u.sectionName}`);
          console.log(`    Document:  ${u.document}`);
          console.log(`    Section:   ${u.sectionId}`);
          console.log(`    Suggested: ${u.suggestedFeatureId}`);
          console.log('');
        }
        console.log('Use /new-feature to create features for these sections.');
      }
      break;
    }
    case 'systems': {
      const featureId = process.argv[3];
      if (!featureId) { console.error('Usage: gdd-discovery.mjs systems <feature-id>'); process.exit(1); }
      const result = disc.discoverSystems(featureId);
      console.log(`Systems for ${featureId}:\n`);

      if (result.existing.length > 0) {
        console.log('EXISTING:');
        result.existing.forEach(s => console.log(`  ✓ ${s.id}`));
      }
      if (result.potential.length > 0) {
        console.log('\nPOTENTIAL:');
        result.potential.forEach(s => console.log(`  ? ${s.id} — ${s.reason}`));
      }
      if (result.existing.length === 0 && result.potential.length === 0) {
        console.log('  No systems found or suggested.');
      }
      break;
    }
    default:
      console.log(`gdd-discovery.mjs <command> [args]

Commands:
  unmapped                    Find GDD sections without matching features
  systems <feature-id>        Discover potential systems for a feature
`);
  }
}

export { Discovery };
