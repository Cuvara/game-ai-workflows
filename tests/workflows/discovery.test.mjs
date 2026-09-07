import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

import { Discovery } from '../../scripts/discovery/gdd-discovery.mjs';

const TEST_ROOT = join(process.cwd(), 'tests', '.test-workspace-disc');

describe('GDD Discovery', () => {
  beforeEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'registry'), { recursive: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'gdd', 'snapshots'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should find unmapped GDD sections', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), `documents:

  - id: game-gdd
    name: Game GDD
    sections:
      - id: gameplay.inventory
        name: Inventory
      - id: gameplay.guild
        name: Guild System
      - id: gameplay.crafting
        name: Crafting
`);

    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    name: Inventory
    section: gameplay.inventory
`);

    const disc = new Discovery(TEST_ROOT);
    const unmapped = disc.findUnmappedSections();

    assert.equal(unmapped.length, 2);
    const ids = unmapped.map(u => u.sectionId);
    assert.ok(ids.includes('gameplay.guild'));
    assert.ok(ids.includes('gameplay.crafting'));
  });

  it('should suggest feature IDs', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), `documents:

  - id: game-gdd
    sections:
      - id: gameplay.guild
        name: Guild System
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features: []`);

    const disc = new Discovery(TEST_ROOT);
    const unmapped = disc.findUnmappedSections();
    assert.equal(unmapped.length, 1);
    assert.ok(unmapped[0].suggestedFeatureId.includes('guild'));
  });

  it('should report all mapped when no gaps', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), `documents:

  - id: game-gdd
    sections:
      - id: gameplay.inventory
        name: Inventory
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    section: gameplay.inventory
`);

    const disc = new Discovery(TEST_ROOT);
    const unmapped = disc.findUnmappedSections();
    assert.equal(unmapped.length, 0);
  });
});

describe('System Discovery', () => {
  beforeEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'registry'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should distinguish existing vs potential systems', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    name: Inventory System
    systems:
      - system.item
      - system.inventory-new
`);
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'systems.yaml'), `systems:

  - id: system.item
    name: Item System
`);

    const disc = new Discovery(TEST_ROOT);
    const result = disc.discoverSystems('gameplay.inventory');

    assert.equal(result.existing.length, 1);
    assert.equal(result.existing[0].id, 'system.item');
    assert.ok(result.potential.length >= 1);
    // system.inventory-new should be NEW
    const newSys = result.potential.find(p => p.id === 'system.inventory-new');
    assert.ok(newSys);
    assert.equal(newSys.status, 'NEW');
  });
});
