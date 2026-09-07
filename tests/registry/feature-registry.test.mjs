import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// We'll test the YAML parser and feature lookup
import { parseSimpleYaml, WorkflowValidator } from '../../scripts/validate/validate.mjs';
import { resolveFeature, listFeatures, levenshtein } from '../../scripts/registry/feature-lookup.mjs';

const TEST_ROOT = join(process.cwd(), 'tests', '.test-workspace');

describe('YAML Parser', () => {
  it('should parse empty features array', () => {
    const result = parseSimpleYaml('features: []');
    assert.deepStrictEqual(result.features, []);
  });

  it('should parse features with properties', () => {
    const yaml = `features:

  - id: gameplay.inventory
    name: Inventory System
    category: gameplay
    status: PLANNED

  - id: gameplay.defender-mode
    name: Defender Mode
    category: gameplay
    status: IN_PROGRESS`;

    const result = parseSimpleYaml(yaml);
    assert.equal(result.features.length, 2);
    assert.equal(result.features[0].id, 'gameplay.inventory');
    assert.equal(result.features[0].name, 'Inventory System');
    assert.equal(result.features[1].id, 'gameplay.defender-mode');
    assert.equal(result.features[1].status, 'IN_PROGRESS');
  });

  it('should handle comments', () => {
    const yaml = `# This is a comment
features:
  # Another comment
  - id: test.feature
    name: Test`;

    const result = parseSimpleYaml(yaml);
    assert.equal(result.features.length, 1);
    assert.equal(result.features[0].id, 'test.feature');
  });
});

describe('Levenshtein Distance', () => {
  it('should return 0 for identical strings', () => {
    assert.equal(levenshtein('test', 'test'), 0);
  });

  it('should handle single character difference', () => {
    assert.equal(levenshtein('cat', 'car'), 1);
  });

  it('should handle typos', () => {
    assert.equal(levenshtein('inventory', 'inventroy'), 2);
    assert.equal(levenshtein('defender', 'defnder'), 1);
  });

  it('should handle empty strings', () => {
    assert.equal(levenshtein('', 'test'), 4);
    assert.equal(levenshtein('test', ''), 4);
  });
});

describe('Feature Lookup', () => {
  beforeEach(() => {
    // Create test workspace
    mkdirSync(join(TEST_ROOT, 'docs', 'registry'), { recursive: true });

    const features = `features:

  - id: gameplay.inventory
    name: Inventory System
    category: gameplay
    status: PLANNED

  - id: gameplay.defender-mode
    name: Defender Mode
    category: gameplay
    status: IN_PROGRESS

  - id: gameplay.equipment
    name: Equipment System
    category: gameplay
    status: READY

  - id: system.wave-spawner
    name: Wave Spawner
    category: system
    status: VERIFIED

  - id: ui.hud
    name: HUD Display
    category: ui
    status: IMPLEMENTED`;

    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), features);
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
  });

  it('should find exact ID match', () => {
    const result = resolveFeature('gameplay.inventory', { projectRoot: TEST_ROOT });
    assert.ok(result.exact);
    assert.equal(result.exact.id, 'gameplay.inventory');
  });

  it('should find exact name match (case-insensitive)', () => {
    const result = resolveFeature('Defender Mode', { projectRoot: TEST_ROOT });
    assert.ok(result.exact);
    assert.equal(result.exact.id, 'gameplay.defender-mode');
  });

  it('should find partial ID match', () => {
    const result = resolveFeature('wave-spawner', { projectRoot: TEST_ROOT });
    assert.ok(result.exact);
    assert.equal(result.exact.id, 'system.wave-spawner');
  });

  it('should handle typo "inventroy"', () => {
    const result = resolveFeature('inventroy', { projectRoot: TEST_ROOT });
    // Should not exact match
    // Should suggest gameplay.inventory as candidate
    if (!result.exact) {
      assert.ok(result.candidates.length > 0);
      assert.equal(result.candidates[0].feature.id, 'gameplay.inventory');
    } else {
      // If fuzzy is close enough to auto-resolve, that's also valid
      assert.equal(result.exact.id, 'gameplay.inventory');
    }
  });

  it('should handle typo "defnder"', () => {
    const result = resolveFeature('defnder', { projectRoot: TEST_ROOT });
    if (!result.exact) {
      assert.ok(result.candidates.length > 0);
      const ids = result.candidates.map(c => c.feature.id);
      assert.ok(ids.includes('gameplay.defender-mode'));
    }
  });

  it('should return empty for unknown feature', () => {
    const result = resolveFeature('completely-unknown-xyz', { projectRoot: TEST_ROOT });
    assert.equal(result.exact, null);
    // May or may not have candidates depending on threshold
  });

  it('should list all features', () => {
    const features = listFeatures({ projectRoot: TEST_ROOT });
    assert.equal(features.length, 5);
  });

  it('should filter by status', () => {
    const planned = listFeatures({ projectRoot: TEST_ROOT, status: 'PLANNED' });
    assert.equal(planned.length, 1);
    assert.equal(planned[0].id, 'gameplay.inventory');
  });

  it('should find by natural language "inventory"', () => {
    const result = resolveFeature('inventory', { projectRoot: TEST_ROOT });
    // Should match gameplay.inventory via partial name/ID
    const match = result.exact || (result.candidates.length > 0 ? result.candidates[0].feature : null);
    assert.ok(match);
    assert.equal(match.id, 'gameplay.inventory');
  });
});
