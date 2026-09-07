import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

import { SystemLookup } from '../../scripts/registry/system-lookup.mjs';

const TEST_ROOT = join(process.cwd(), 'tests', '.test-workspace-sys');

describe('System Lookup', () => {
  beforeEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'registry'), { recursive: true });

    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    name: Inventory System
    category: gameplay
    status: IN_PROGRESS
    systems:
      - system.item
      - system.save-load

  - id: gameplay.equipment
    name: Equipment System
    category: gameplay
    status: PLANNED
    systems:
      - system.item
`);

    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'systems.yaml'), `systems:

  - id: system.item
    name: Item System

  - id: system.save-load
    name: Save Load System
`);
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should find system by ID', () => {
    const lookup = new SystemLookup(TEST_ROOT);
    const system = lookup.findSystem('system.item');
    assert.ok(system);
    assert.equal(system.id, 'system.item');
  });

  it('should trace system to features (reverse lookup)', () => {
    const lookup = new SystemLookup(TEST_ROOT);
    const features = lookup.systemToFeatures('system.item');
    assert.equal(features.length, 2);
    const ids = features.map(f => f.id);
    assert.ok(ids.includes('gameplay.inventory'));
    assert.ok(ids.includes('gameplay.equipment'));
  });

  it('should trace feature to systems', () => {
    const lookup = new SystemLookup(TEST_ROOT);
    const systems = lookup.featureToSystems('gameplay.inventory');
    assert.equal(systems.length, 2);
    assert.equal(systems[0].id, 'system.item');
    assert.equal(systems[1].id, 'system.save-load');
  });

  it('should mark missing systems', () => {
    // Add a feature referencing non-existent system
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.test
    name: Test
    systems:
      - system.nonexistent
`);
    const lookup = new SystemLookup(TEST_ROOT);
    const systems = lookup.featureToSystems('gameplay.test');
    assert.equal(systems.length, 1);
    assert.ok(systems[0].missing);
  });

  it('should do full feature trace', () => {
    const lookup = new SystemLookup(TEST_ROOT);
    const trace = lookup.traceFeature('gameplay.inventory');
    assert.ok(trace);
    assert.equal(trace.feature.id, 'gameplay.inventory');
    assert.equal(trace.systems.length, 2);
    // gameplay.equipment also uses system.item → should appear in related
    assert.ok(trace.relatedFeatures.includes('gameplay.equipment'));
  });

  it('should return null for unknown feature trace', () => {
    const lookup = new SystemLookup(TEST_ROOT);
    const trace = lookup.traceFeature('unknown.feature');
    assert.equal(trace, null);
  });
});
