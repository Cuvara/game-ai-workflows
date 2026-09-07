import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { FeatureGenerator } from '../../scripts/registry/generate-features.mjs';

const TEST_ROOT = join(process.cwd(), 'tests', '.test-workspace-gen');

describe('Feature Generator', () => {
  beforeEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'registry'), { recursive: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'gdd', 'snapshots'), { recursive: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'features'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should generate features from GDD registry sections', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), `documents:

  - id: game-gdd
    name: Game GDD
    sections:
      - id: gameplay.inventory
        name: Inventory System
      - id: gameplay.combat
        name: Combat System
      - id: ui.hud
        name: HUD Display
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), 'features: []\n');

    const origLog = console.log;
    console.log = () => {};
    const gen = new FeatureGenerator(TEST_ROOT);
    const result = gen.generate();
    console.log = origLog;

    assert.equal(result.created.length, 3);
    assert.ok(result.created.includes('gameplay.inventory'));
    assert.ok(result.created.includes('gameplay.combat'));
    assert.ok(result.created.includes('ui.hud'));
  });

  it('should generate features from local GDD markdown', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'gdd', 'game-gdd.md'), `# Game GDD

## Defender Mode

Tower defense gameplay.

## Inventory

Item management system.

## Guild System

Multiplayer guilds.
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), 'documents: []\n');
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), 'features: []\n');

    const origLog = console.log;
    console.log = () => {};
    const gen = new FeatureGenerator(TEST_ROOT);
    const result = gen.generate();
    console.log = origLog;

    assert.equal(result.created.length, 3);
    // Check features.yaml was written
    const content = readFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), 'utf-8');
    assert.ok(content.includes('defender-mode'));
    assert.ok(content.includes('inventory'));
    assert.ok(content.includes('guild-system'));
  });

  it('should preserve existing features', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.existing
    name: Existing Feature
    category: gameplay
    status: VERIFIED
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'gdd', 'gdd.md'), `# GDD

## New Feature

Something new.
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), 'documents: []\n');

    const origLog = console.log;
    console.log = () => {};
    const gen = new FeatureGenerator(TEST_ROOT);
    const result = gen.generate();
    console.log = origLog;

    assert.equal(result.total, 2); // 1 existing + 1 new
    assert.equal(result.created.length, 1);
    // Existing should still be there
    const content = readFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), 'utf-8');
    assert.ok(content.includes('gameplay.existing'));
    assert.ok(content.includes('VERIFIED')); // status preserved
  });

  it('should skip duplicate sections', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    name: Inventory
    category: gameplay
    status: IN_PROGRESS
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), `documents:

  - id: game-gdd
    sections:
      - id: gameplay.inventory
        name: Inventory System
`);

    const origLog = console.log;
    console.log = () => {};
    const gen = new FeatureGenerator(TEST_ROOT);
    const result = gen.generate();
    console.log = origLog;

    assert.equal(result.created.length, 0);
    assert.equal(result.skipped.length, 1);
    assert.equal(result.total, 1);
  });

  it('should create feature directories', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'gdd', 'gdd.md'), `# GDD

## Combat System

Fight things.
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), 'documents: []\n');
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), 'features: []\n');

    const origLog = console.log;
    console.log = () => {};
    const gen = new FeatureGenerator(TEST_ROOT);
    gen.generate();
    console.log = origLog;

    // "Combat System" contains "system" → inferred as system category
    assert.ok(existsSync(join(TEST_ROOT, 'docs', 'features', 'system.combat-system')));
  });

  it('should handle empty GDD gracefully', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), 'documents: []\n');
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), 'features: []\n');

    const origLog = console.log;
    console.log = () => {};
    const gen = new FeatureGenerator(TEST_ROOT);
    const result = gen.generate();
    console.log = origLog;

    assert.equal(result.created.length, 0);
    assert.equal(result.total, 0);
  });
});
